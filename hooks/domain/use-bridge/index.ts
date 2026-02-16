import {
  getNetworkConfig,
  IkaClient,
} from '@ika.xyz/sdk';
import { ChainId, DWalletAddress } from '@interest-protocol/xbridge-sdk';
import type { SuiClient } from '@mysten/sui/client';
import { fromHex, toBase64 } from '@mysten/sui/utils';
import { usePrivy } from '@privy-io/react-auth';
import {
  type Base64EncodedWireTransaction,
  type Signature,
  unwrapSimulationError,
} from '@solana/kit';
import bs58 from 'bs58';
import { useEffect, useRef, useState } from 'react';
import invariant from 'tiny-invariant';
import { toasting } from '@/components/ui/toast';
import { WSOL_SUI_TYPE } from '@/constants/bridged-tokens';
import type { ChainKey } from '@/constants/chains';
import { NATIVE_SOL_MINT, SOL_DECIMALS } from '@/constants/coins';
import useSolanaRpc from '@/hooks/blockchain/use-solana-connection';
import useSuiClient from '@/hooks/blockchain/use-sui-client';
import useBalances from '@/hooks/domain/use-balances';
import { useOnboarding } from '@/hooks/store/use-onboarding';
import { post } from '@/lib/api/client';
import { createSolanaAdapter } from '@/lib/chain-adapters/solana-adapter';
import { confirmSolanaTransaction } from '@/lib/solana/confirm-transaction';
import {
  bridgeBurnCreate,
  bridgeBurnFinalize,
  bridgeBurnSign,
  bridgeBurnVote,
  bridgeMint,
} from '@/lib/xbridge/client';
import { waitForIkaSignature } from '@/lib/xbridge/wait-for-ika-signature';

import { extractErrorMessage } from '@/utils';
import { haptic } from '@/utils/haptic';

export type BridgeStatus =
  | 'idle'
  | 'depositing'
  | 'creating'
  | 'voting'
  | 'executing'
  | 'waiting'
  | 'success'
  | 'error';

export type BridgeDirection =
  | 'sol-to-wsol'
  | 'wsol-to-sol'
  | 'sui-to-wsui'
  | 'wsui-to-sui';

export interface BridgeResult {
  direction: BridgeDirection;
  sourceChainKey: ChainKey;
  destChainKey: ChainKey;
  fromSymbol: string;
  toSymbol: string;
  amount: bigint;
  decimals: number;
  depositDigest: string;
  mintDigest: string;
  startedAt: number;
}

interface BridgeParams {
  direction: BridgeDirection;
  amount: bigint;
}

export const useBridge = () => {
  const { user } = usePrivy();
  const [status, setStatus] = useState<BridgeStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BridgeResult | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const ikaClientStateRef = useRef<{
    suiClient: SuiClient | null;
    client: IkaClient | null;
    promise: Promise<IkaClient> | null;
  }>({ suiClient: null, client: null, promise: null });

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const solanaRpc = useSolanaRpc();
  const suiClient = useSuiClient();
  const { suiAddress, solanaAddress, mutateSuiBalances, mutateSolanaBalances } =
    useBalances();

  const ensureIkaClient = async (): Promise<IkaClient> => {
    const state = ikaClientStateRef.current;

    // Reset if suiClient changed (user switched RPC)
    if (state.suiClient !== suiClient) {
      ikaClientStateRef.current = { suiClient, client: null, promise: null };
    }

    const current = ikaClientStateRef.current;
    if (current.client) return current.client;

    if (!current.promise) {
      current.promise = (async () => {
        try {
          const client = new IkaClient({
            suiClient,
            config: getNetworkConfig('mainnet'),
          });
          await client.initialize();
          current.client = client;
          return client;
        } catch (err) {
          // Reset both fields so next call retries cleanly
          current.client = null;
          current.promise = null;
          throw err;
        }
      })();
    }
    return current.promise;
  };

  useEffect(() => {
    ensureIkaClient().catch((error) => {
      console.error('[bridge] IKA client init failed', error);
    });
  }, [suiClient]);

  const getSolanaAdapter = () =>
    createSolanaAdapter(solanaRpc, mutateSolanaBalances);

  const bridgeSolToWsol = async (
    amount: bigint,
    toastId: string,
    signal: AbortSignal
  ) => {
    invariant(user && solanaAddress && suiAddress, 'Wallets not connected');

    const dwalletAddress = DWalletAddress[ChainId.Solana];
    const adapter = getSolanaAdapter();

    setStatus('depositing');
    toasting.update(toastId, 'Depositing to bridge...');

    const { txId: depositSignature } = await adapter.deposit({
      userId: user.id,
      recipient: dwalletAddress,
      amount: amount.toString(),
    });

    await adapter.confirmTransaction(depositSignature);
    if (signal.aborted)
      throw new DOMException('The operation was aborted.', 'AbortError');

    setStatus('creating');
    toasting.update(toastId, 'Minting bridged tokens...');

    const { digest } = await bridgeMint({
      userId: user.id,
      sourceChain: ChainId.Solana,
      sourceToken: Array.from(bs58.decode(NATIVE_SOL_MINT)),
      sourceDecimals: SOL_DECIMALS,
      sourceAddress: Array.from(bs58.decode(solanaAddress)),
      sourceAmount: amount.toString(),
      coinType: WSOL_SUI_TYPE.split('<')[1].replace('>', ''),
      depositSignature,
    });

    if (signal.aborted)
      throw new DOMException('The operation was aborted.', 'AbortError');

    setStatus('waiting');
    toasting.update(toastId, 'Confirming transaction...');
    await suiClient.waitForTransaction({ digest });
    await mutateSuiBalances();

    return { depositDigest: depositSignature, mintDigest: digest };
  };

  const bridgeWsolToSol = async (
    amount: bigint,
    toastId: string,
    signal: AbortSignal
  ) => {
    invariant(user && solanaAddress && suiAddress, 'Wallets not connected');
    const nonceAddr = useOnboarding.getState().nonceAddress;
    invariant(nonceAddr, 'Nonce account not set up');

    const coinType = WSOL_SUI_TYPE.split('<')[1].replace('>', '');

    setStatus('creating');
    toasting.update(toastId, 'Creating burn request...');

    const createResult = await bridgeBurnCreate({
      userId: user.id,
      sourceAmount: amount.toString(),
      destinationAddress: Array.from(bs58.decode(solanaAddress)),
      nonceAddress: nonceAddr,
      coinType,
    });

    if (signal.aborted)
      throw new DOMException('The operation was aborted.', 'AbortError');

    setStatus('waiting');
    toasting.update(toastId, 'Waiting for signature...');

    const voteSignParams = {
      userId: user.id,
      requestId: createResult.requestId,
      coinType,
    };

    const [voteResult, signResult] = await Promise.all([
      bridgeBurnVote(voteSignParams),
      bridgeBurnSign({
        ...voteSignParams,
        presignCapId: createResult.presignCapId,
      }),
    ]);

    if (signal.aborted)
      throw new DOMException('The operation was aborted.', 'AbortError');

    setStatus('executing');
    toasting.update(toastId, 'Finalizing burn on Sui...');

    const finalizeResult = await bridgeBurnFinalize({
      userId: user.id,
      requestId: createResult.requestId,
      burnCapId: createResult.burnCapId,
      presignCapId: createResult.presignCapId,
      coinType,
      voteSignature: voteResult.signature,
      voteTimestampMs: voteResult.timestampMs,
      solverSignature: signResult.solverSignature,
    });

    if (signal.aborted)
      throw new DOMException('The operation was aborted.', 'AbortError');

    toasting.update(toastId, 'Waiting for dWallet signature...');
    const ikaClient = await ensureIkaClient();
    const dwalletSignature = await waitForIkaSignature({
      ikaClient,
      signId: finalizeResult.signId,
      timeoutMs: 120_000,
      intervalMs: 3_000,
      signal,
    });
    invariant(
      dwalletSignature.length === 64,
      `Expected 64-byte Ed25519 signature, got ${dwalletSignature.length} bytes`
    );

    toasting.update(toastId, 'Broadcasting to Solana...');
    const messageBytes = fromHex(createResult.message);
    const userSigBytes = fromHex(createResult.userSignature);

    const NUM_SIGS = 2;
    const SIG_SIZE = 64;
    const NUM_SIGS_OFFSET = 0;
    const SIG_1_OFFSET = 1;
    const SIG_2_OFFSET = SIG_1_OFFSET + SIG_SIZE;
    const MESSAGE_OFFSET = SIG_2_OFFSET + SIG_SIZE;

    const rawTx = new Uint8Array(1 + SIG_SIZE * NUM_SIGS + messageBytes.length);
    rawTx[NUM_SIGS_OFFSET] = NUM_SIGS;
    rawTx.set(userSigBytes, SIG_1_OFFSET);
    rawTx.set(dwalletSignature, SIG_2_OFFSET);
    rawTx.set(messageBytes, MESSAGE_OFFSET);

    const base64Tx = toBase64(rawTx) as Base64EncodedWireTransaction;

    let solanaSignature: string;
    try {
      solanaSignature = (await solanaRpc
        .sendTransaction(base64Tx, {
          encoding: 'base64',
          preflightCommitment: 'confirmed',
        })
        .send()) as string;
    } catch (err) {
      const cause = unwrapSimulationError(err);
      console.error('[bridge] Solana sendTransaction failed:', cause);
      throw cause;
    }

    toasting.update(toastId, 'Confirming Solana transaction...');
    await confirmSolanaTransaction(solanaRpc, solanaSignature as Signature);
    await Promise.all([mutateSuiBalances(), mutateSolanaBalances()]);
    return {
      depositDigest: finalizeResult.executeDigest,
      mintDigest: solanaSignature as string,
    };
  };

  const bridge = async ({ direction, amount }: BridgeParams) => {
    const BRIDGE_TOAST_ID = 'bridge-operation';

    if (!user) {
      toasting.error({
        action: 'Bridge',
        message: 'Please connect your wallet first',
      });
      return;
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    try {
      setStatus('idle');
      setError(null);
      setResult(null);
      const startedAt = Date.now();
      toasting.loadingWithId(
        { message: 'Starting bridge...' },
        BRIDGE_TOAST_ID
      );

      let digests: { depositDigest: string; mintDigest: string } | undefined;

      switch (direction) {
        case 'sol-to-wsol':
          digests = await bridgeSolToWsol(amount, BRIDGE_TOAST_ID, signal);
          break;
        case 'wsol-to-sol':
          digests = await bridgeWsolToSol(amount, BRIDGE_TOAST_ID, signal);
          break;
        case 'sui-to-wsui':
        case 'wsui-to-sui':
          throw new Error(`${direction} bridge not yet implemented`);
        default:
          throw new Error('Invalid bridge direction');
      }

      if (digests) {
        const isBurn = direction === 'wsol-to-sol';
        setResult({
          direction,
          sourceChainKey: isBurn ? 'sui' : 'solana',
          destChainKey: isBurn ? 'solana' : 'sui',
          fromSymbol: isBurn ? 'wSOL' : 'SOL',
          toSymbol: isBurn ? 'SOL' : 'wSOL',
          amount,
          decimals: SOL_DECIMALS,
          depositDigest: digests.depositDigest,
          mintDigest: digests.mintDigest,
          startedAt,
        });
      }

      setStatus('success');
      haptic.success();
      toasting.dismiss(BRIDGE_TOAST_ID);

      post(
        '/api/presign/ensure',
        { userId: user.id },
        {
          timeout: 30_000,
          retries: 0,
        }
      ).catch((err) => {
        console.warn('[bridge] presign ensure failed:', err);
      });

      return true;
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setStatus('idle');
        toasting.dismiss(BRIDGE_TOAST_ID);
        return;
      }
      setStatus('error');
      haptic.error();
      console.error('[bridge] failed:', err);
      const message = extractErrorMessage(err, 'Bridge failed');
      setError(message);
      toasting.dismiss(BRIDGE_TOAST_ID);
      toasting.error({ action: 'Bridge', message: `Failed: ${message}` });
    }
  };

  const reset = () => {
    setStatus('idle');
    setError(null);
    setResult(null);
  };

  return {
    bridge,
    reset,
    status,
    error,
    result,
    isLoading: status !== 'idle' && status !== 'success' && status !== 'error',
  };
};

export default useBridge;
