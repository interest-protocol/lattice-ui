import { ChainId, DWalletAddress } from '@interest-protocol/xbridge-sdk';
import { usePrivy } from '@privy-io/react-auth';
import bs58 from 'bs58';
import { useEffect, useRef, useState } from 'react';
import invariant from 'tiny-invariant';

import { toasting } from '@/components/ui/toast';
import { WSOL_SUI_TYPE } from '@/constants/bridged-tokens';
import type { ChainKey } from '@/constants/chains';
import { NATIVE_SOL_MINT, SOL_DECIMALS } from '@/constants/coins';
import useSolanaRpc from '@/hooks/blockchain/use-solana-connection';
import useBalances from '@/hooks/domain/use-balances';
import { useOnboarding } from '@/hooks/store/use-onboarding';
import { createSolanaAdapter } from '@/lib/chain-adapters/solana-adapter';
import { bridgeBurn, bridgeMint, broadcastBurn } from '@/lib/xbridge/client';
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

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const solanaRpc = useSolanaRpc();
  const { suiAddress, solanaAddress, mutateSuiBalances, mutateSolanaBalances } =
    useBalances();

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

    setStatus('creating');
    toasting.update(toastId, 'Creating burn request...');

    const coinType = WSOL_SUI_TYPE.split('<')[1].replace('>', '');
    const burnResult = await bridgeBurn({
      userId: user.id,
      sourceAmount: amount.toString(),
      destinationAddress: Array.from(bs58.decode(solanaAddress)),
      nonceAddress: nonceAddr,
      coinType,
    });

    if (signal.aborted)
      throw new DOMException('The operation was aborted.', 'AbortError');

    setStatus('waiting');
    toasting.update(toastId, 'Broadcasting to Solana...');

    const broadcast = await broadcastBurn({
      userId: user.id,
      requestId: burnResult.requestId,
      signId: burnResult.signId,
      userSignature: burnResult.userSignature,
      message: burnResult.message,
    });

    if (signal.aborted)
      throw new DOMException('The operation was aborted.', 'AbortError');

    await Promise.all([mutateSuiBalances(), mutateSolanaBalances()]);
    return {
      depositDigest: burnResult.executeDigest,
      mintDigest: broadcast.solanaSignature,
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
      return true;
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setStatus('idle');
        toasting.dismiss(BRIDGE_TOAST_ID);
        return;
      }
      setStatus('error');
      haptic.error();
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
