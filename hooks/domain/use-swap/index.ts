import { DWalletAddress, WalletKey } from '@interest-protocol/xswap-sdk';
import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useRef, useState } from 'react';
import invariant from 'tiny-invariant';
import { useLocalStorage } from 'usehooks-ts';

import { toasting } from '@/components/ui/toast';
import { DEFAULT_SLIPPAGE_BPS, SLIPPAGE_STORAGE_KEY } from '@/constants';
import { type ChainKey, chainKeyFromTokenType } from '@/constants/chains';
import { REQUEST_DEADLINE_MS } from '@/constants/coins';
import useSolanaRpc from '@/hooks/blockchain/use-solana-connection';
import useSuiClient from '@/hooks/blockchain/use-sui-client';
import useTokenPrices from '@/hooks/blockchain/use-token-prices';
import useBalances from '@/hooks/domain/use-balances';
import useSolverMetadata from '@/hooks/domain/use-solver-metadata';
import type { ChainAdapter } from '@/lib/chain-adapters';
import { sdkChainIdFromKey } from '@/lib/chain-adapters';
import { createSolanaAdapter } from '@/lib/chain-adapters/solana-adapter';
import { createSuiAdapter } from '@/lib/chain-adapters/sui-adapter';
import { fetchNewRequestProof } from '@/lib/enclave/client';
import { CurrencyAmount, Percent, Token, Trade } from '@/lib/entities';
import { fetchMetadata, fetchStatus, fulfill } from '@/lib/solver/client';
import { createSwapRequest } from '@/lib/xswap/client';
import { extractErrorMessage } from '@/utils';
import { haptic } from '@/utils/haptic';

export type SwapStatus =
  | 'idle'
  | 'depositing'
  | 'verifying'
  | 'creating'
  | 'waiting'
  | 'success'
  | 'error';

export interface SwapResult {
  sourceChainKey: ChainKey;
  destChainKey: ChainKey;
  fromAmount: bigint;
  fromType: string;
  toType: string;
  depositDigest: string;
  requestId: string;
  destinationTxDigest?: string;
  toAmount: bigint;
  feeAmount: bigint;
  startedAt: number;
}

interface SwapParams {
  fromType: string;
  toType: string;
  fromAmount: bigint;
}

const ENCLAVE_RETRY_ATTEMPTS = 5;
const ENCLAVE_RETRY_BASE_DELAY_MS = 500;
const ENCLAVE_RETRY_MAX_DELAY_MS = 4000;

const withRetry = async <T>(
  fn: () => Promise<T>,
  attempts: number,
  baseDelayMs: number,
  signal?: AbortSignal,
  maxDelayMs?: number
): Promise<T> => {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === attempts - 1) throw err;
      if (signal?.aborted) {
        throw new DOMException('The operation was aborted.', 'AbortError');
      }
      const delay = maxDelayMs
        ? Math.min(baseDelayMs * 2 ** i, maxDelayMs)
        : baseDelayMs;
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, delay);
        signal?.addEventListener(
          'abort',
          () => {
            clearTimeout(timer);
            reject(
              new DOMException('The operation was aborted.', 'AbortError')
            );
          },
          { once: true }
        );
      });
    }
  }
  throw new Error('Retry exhausted');
};

export const useSwap = () => {
  const { user } = usePrivy();
  const [status, setStatus] = useState<SwapStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SwapResult | null>(null);

  const suiClient = useSuiClient();
  const solanaRpc = useSolanaRpc();
  const { suiAddress, solanaAddress, mutateSuiBalances, mutateSolanaBalances } =
    useBalances();

  const { metadata: cachedMetadata } = useSolverMetadata();
  const { getPrice } = useTokenPrices();
  const [slippageBps] = useLocalStorage(
    SLIPPAGE_STORAGE_KEY,
    DEFAULT_SLIPPAGE_BPS
  );
  const abortRef = useRef<AbortController | null>(null);
  const getPriceRef = useRef(getPrice);
  getPriceRef.current = getPrice;
  const slippageBpsRef = useRef(slippageBps);
  slippageBpsRef.current = slippageBps;

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (status !== 'success' || !result || result.destinationTxDigest) return;

    const controller = new AbortController();

    const poll = async () => {
      const POLL_INTERVAL_MS = 2000;
      const MAX_POLLS = 30;

      for (let i = 0; i < MAX_POLLS; i++) {
        if (controller.signal.aborted) return;

        try {
          const reqStatus = await fetchStatus(
            result.requestId,
            controller.signal
          );

          if (reqStatus.destinationTxDigest) {
            setResult((prev) =>
              prev
                ? {
                    ...prev,
                    destinationTxDigest: reqStatus.destinationTxDigest,
                  }
                : prev
            );
            return;
          }
        } catch {
          // Ignore errors, retry
        }

        await new Promise<void>((resolve) =>
          setTimeout(resolve, POLL_INTERVAL_MS)
        );
      }
    };

    poll().catch(() => {});
    return () => controller.abort();
  }, [status, result?.requestId, result?.destinationTxDigest]);

  const getAdapter = (chainKey: ChainKey): ChainAdapter => {
    const adapterFactories: Record<ChainKey, () => ChainAdapter> = {
      sui: () => createSuiAdapter(suiClient, mutateSuiBalances),
      solana: () => createSolanaAdapter(solanaRpc, mutateSolanaBalances),
    };
    return adapterFactories[chainKey]();
  };

  const swap = async ({ fromType, toType, fromAmount }: SwapParams) => {
    const SWAP_TOAST_ID = 'swap-operation';

    if (!user) {
      toasting.error({
        action: 'Swap',
        message: 'Please connect your wallet first',
      });
      return;
    }

    const sourceChainKey = chainKeyFromTokenType(fromType);
    const destChainKey = chainKeyFromTokenType(toType);

    if (sourceChainKey === destChainKey) {
      toasting.error({ action: 'Swap', message: 'Invalid swap direction' });
      return;
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    const sourceChain = sdkChainIdFromKey(sourceChainKey);
    const destinationChain = sdkChainIdFromKey(destChainKey);
    const dwalletAddress = DWalletAddress[sourceChain];

    const sourceAdapter = getAdapter(sourceChainKey);
    const destAdapter = getAdapter(destChainKey);

    try {
      const startedAt = Date.now();
      setStatus('depositing');
      setError(null);
      toasting.loadingWithId(
        { message: 'Depositing funds to bridge...' },
        SWAP_TOAST_ID
      );

      invariant(suiAddress && solanaAddress, 'Both wallets must be connected');

      const { txId: depositDigest } = await sourceAdapter.deposit({
        userId: user.id,
        recipient: dwalletAddress,
        amount: fromAmount.toString(),
      });

      await sourceAdapter.confirmTransaction(depositDigest);

      setStatus('verifying');
      toasting.update(SWAP_TOAST_ID, 'Verifying deposit on-chain...');

      const [proof, metadata] = await Promise.all([
        withRetry(
          () => fetchNewRequestProof(depositDigest, sourceChain, signal),
          ENCLAVE_RETRY_ATTEMPTS,
          ENCLAVE_RETRY_BASE_DELAY_MS,
          signal,
          ENCLAVE_RETRY_MAX_DELAY_MS
        ),
        cachedMetadata
          ? Promise.resolve(cachedMetadata)
          : fetchMetadata(signal),
      ]);

      setStatus('creating');
      toasting.update(SWAP_TOAST_ID, 'Creating swap request...');

      const solverSuiAddress = metadata.solver.sui;
      const solverSolanaAddress = metadata.solver.solana;

      const sourceAddress = sourceAdapter.encodeAddress(
        sourceChainKey === 'sui' ? suiAddress : solanaAddress
      );
      const destinationAddress = destAdapter.encodeAddress(
        destChainKey === 'sui' ? suiAddress : solanaAddress
      );
      const solverSender = destAdapter.encodeAddress(
        destChainKey === 'sui' ? solverSuiAddress : solverSolanaAddress
      );
      const solverRecipient = sourceAdapter.encodeAddress(
        sourceChainKey === 'sui' ? solverSuiAddress : solverSolanaAddress
      );
      const destinationToken = destAdapter.encodeNativeToken();

      const walletKey = WalletKey[sourceChain];
      const deadline = BigInt(Date.now() + REQUEST_DEADLINE_MS);

      const inputToken = Token.fromType(fromType);
      const outputToken = Token.fromType(toType);
      const inputPriceUsd = getPriceRef.current(fromType);
      const outputPriceUsd = getPriceRef.current(toType);

      invariant(
        inputPriceUsd && outputPriceUsd,
        'Token prices unavailable — cannot calculate safe minimum amount'
      );

      const trade = Trade.fromOraclePrices({
        inputAmount: CurrencyAmount.fromRawAmount(inputToken, fromAmount),
        outputToken,
        inputPriceUsd,
        outputPriceUsd,
        slippage: Percent.fromBps(slippageBpsRef.current),
      });
      const minDestinationAmount = trade.minimumReceived.raw.toString();

      const { requestId, requestInitialSharedVersion } =
        await createSwapRequest(
          {
            userId: user.id,
            proof: {
              signature: Array.from(proof.signature),
              digest: Array.from(proof.digest),
              timestampMs: proof.timestampMs.toString(),
              dwalletAddress: Array.from(proof.dwalletAddress),
              user: Array.from(proof.user),
              chainId: proof.chainId,
              token: Array.from(proof.token),
              amount: proof.amount.toString(),
            },
            walletKey: walletKey.toString(),
            sourceAddress: Array.from(sourceAddress),
            sourceChain,
            destinationChain,
            destinationAddress: Array.from(destinationAddress),
            destinationToken: Array.from(destinationToken),
            minDestinationAmount,
            minConfirmations: 0,
            deadline: deadline.toString(),
            solverSender: Array.from(solverSender),
            solverRecipient: Array.from(solverRecipient),
          },
          signal
        );

      invariant(requestId, 'Swap request created but requestId is missing');

      setStatus('waiting');
      toasting.update(SWAP_TOAST_ID, 'Waiting for solver to fulfill...');

      const fulfillResult = await fulfill(
        {
          requestId,
          userAddress: suiAddress,
          requestInitialSharedVersion: requestInitialSharedVersion ?? undefined,
        },
        signal
      );

      const minimumReceived = trade.minimumReceived.raw;
      const expectedOutput = trade.expectedOutput.raw;
      const feeAmount = expectedOutput - minimumReceived;

      setResult({
        sourceChainKey,
        destChainKey,
        fromAmount,
        fromType,
        toType,
        depositDigest,
        requestId,
        destinationTxDigest: fulfillResult.destinationTxDigest,
        toAmount: minimumReceived,
        feeAmount,
        startedAt,
      });
      setStatus('success');
      haptic.success();
      toasting.dismiss(SWAP_TOAST_ID);

      mutateSuiBalances();
      mutateSolanaBalances();
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setStatus('idle');
        toasting.dismiss(SWAP_TOAST_ID);
        return;
      }
      setStatus('error');
      haptic.error();
      const message = extractErrorMessage(err, 'Swap failed');
      setError(message);
      toasting.dismiss(SWAP_TOAST_ID);
      toasting.error({ action: 'Swap', message: `Failed: ${message}` });
    }
  };

  const reset = () => {
    setStatus('idle');
    setError(null);
    setResult(null);
  };

  return {
    swap,
    reset,
    status,
    error,
    result,
    isLoading: status !== 'idle' && status !== 'success' && status !== 'error',
  };
};

export default useSwap;
