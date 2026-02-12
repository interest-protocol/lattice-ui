import { ChainId, DWalletAddress } from '@interest-protocol/xbridge-sdk';
import { usePrivy } from '@privy-io/react-auth';
import bs58 from 'bs58';
import { useEffect, useRef, useState } from 'react';
import invariant from 'tiny-invariant';

import { toasting } from '@/components/ui/toast';
import { WSOL_SUI_TYPE } from '@/constants/bridged-tokens';
import { NATIVE_SOL_MINT, SOL_DECIMALS } from '@/constants/coins';
import useSolanaRpc from '@/hooks/blockchain/use-solana-connection';
import useBalances from '@/hooks/domain/use-balances';
import { createSolanaAdapter } from '@/lib/chain-adapters/solana-adapter';
import {
  createMintRequest,
  executeMint,
  setMintDigest,
  voteMint,
} from '@/lib/xbridge/client';
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

interface BridgeParams {
  direction: BridgeDirection;
  amount: bigint;
}

export const useBridge = () => {
  const { user } = usePrivy();
  const [status, setStatus] = useState<BridgeStatus>('idle');
  const [error, setError] = useState<string | null>(null);
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
    toasting.update(toastId, 'Creating mint request...');
    const { requestId, mintCapId } = await createMintRequest({
      userId: user.id,
      sourceChain: ChainId.Solana,
      sourceToken: Array.from(bs58.decode(NATIVE_SOL_MINT)),
      sourceDecimals: SOL_DECIMALS,
      sourceAddress: Array.from(bs58.decode(solanaAddress)),
      sourceAmount: amount.toString(),
      coinType: WSOL_SUI_TYPE.split('<')[1].replace('>', ''),
    });

    invariant(requestId && mintCapId, 'Failed to get requestId or mintCapId');
    if (signal.aborted)
      throw new DOMException('The operation was aborted.', 'AbortError');

    setStatus('voting');
    toasting.update(toastId, 'Verifying with enclave...');
    await setMintDigest({
      userId: user.id,
      requestId,
      mintCapId,
      depositSignature,
    });

    if (signal.aborted)
      throw new DOMException('The operation was aborted.', 'AbortError');

    await voteMint({
      userId: user.id,
      requestId,
      depositSignature,
    });

    if (signal.aborted)
      throw new DOMException('The operation was aborted.', 'AbortError');

    setStatus('executing');
    toasting.update(toastId, 'Minting tokens...');
    await executeMint({
      userId: user.id,
      requestId,
      mintCapId,
    });

    setStatus('waiting');
    toasting.update(toastId, 'Confirming transaction...');
    await mutateSuiBalances();
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
      toasting.loadingWithId(
        { message: 'Starting bridge...' },
        BRIDGE_TOAST_ID
      );

      switch (direction) {
        case 'sol-to-wsol':
          await bridgeSolToWsol(amount, BRIDGE_TOAST_ID, signal);
          break;
        case 'wsol-to-sol':
        case 'sui-to-wsui':
        case 'wsui-to-sui':
          throw new Error(`${direction} bridge not yet implemented`);
        default:
          throw new Error('Invalid bridge direction');
      }

      setStatus('success');
      haptic.success();
      toasting.dismiss(BRIDGE_TOAST_ID);
      toasting.success({
        action: 'Bridge',
        message: 'Your tokens are ready',
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
      const message = extractErrorMessage(err, 'Bridge failed');
      setError(message);
      toasting.dismiss(BRIDGE_TOAST_ID);
      toasting.error({ action: 'Bridge', message: `Failed: ${message}` });
    }
  };

  const reset = () => {
    setStatus('idle');
    setError(null);
  };

  return {
    bridge,
    reset,
    status,
    error,
    isLoading: status !== 'idle' && status !== 'success' && status !== 'error',
  };
};

export default useBridge;
