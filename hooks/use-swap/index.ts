import { SolanaPubkey, SuiAddress } from '@interest-protocol/registry-sdk';
import {
  ChainId,
  DWalletAddress,
  WalletKey,
} from '@interest-protocol/xswap-sdk';
import { SUI_TYPE_ARG } from '@mysten/sui/utils';
import { usePrivy } from '@privy-io/react-auth';
import type BigNumber from 'bignumber.js';
import { useCallback, useState } from 'react';
import { toast } from 'react-hot-toast';

import { SOL_TYPE } from '@/constants/coins';
import useSolanaBalances from '@/hooks/use-solana-balances';
import useSolanaConnection from '@/hooks/use-solana-connection';
import useSuiBalances from '@/hooks/use-sui-balances';
import useSuiClient from '@/hooks/use-sui-client';
import { fetchNewRequestProof } from '@/lib/enclave/client';
import { fetchMetadata } from '@/lib/solver/client';
import { sendSolana, sendSui } from '@/lib/wallet/client';
import { createSwapRequest } from '@/lib/xswap/client';

const NATIVE_SOL_MINT = 'So11111111111111111111111111111111111111112';
const REQUEST_DEADLINE_MS = 60 * 60 * 1000;
const BALANCE_POLL_INTERVAL_MS = 5000;
const BALANCE_POLL_MAX_ATTEMPTS = 24;

export type SwapStatus =
  | 'idle'
  | 'depositing'
  | 'verifying'
  | 'creating'
  | 'waiting'
  | 'success'
  | 'error';

interface SwapParams {
  fromType: string;
  toType: string;
  fromAmount: BigNumber;
}

export const useSwap = () => {
  const { user } = usePrivy();
  const [status, setStatus] = useState<SwapStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const suiClient = useSuiClient();
  const solanaConnection = useSolanaConnection();

  const suiWallet = user?.linkedAccounts?.find((a) => {
    if (a.type !== 'wallet' || !('address' in a)) return false;
    if ('chainType' in a && String(a.chainType).toLowerCase() === 'sui')
      return true;
    return (
      typeof a.address === 'string' &&
      a.address.startsWith('0x') &&
      a.address.length === 66
    );
  });
  const suiAddress =
    suiWallet && 'address' in suiWallet ? suiWallet.address : null;

  const solanaWallet = user?.linkedAccounts?.find((a) => {
    if (a.type !== 'wallet' || !('address' in a)) return false;
    if ('chainType' in a && String(a.chainType).toLowerCase() === 'solana')
      return true;
    return (
      typeof a.address === 'string' &&
      !a.address.startsWith('0x') &&
      a.address.length >= 32 &&
      a.address.length <= 44
    );
  });
  const solanaAddress =
    solanaWallet && 'address' in solanaWallet ? solanaWallet.address : null;

  const { mutate: mutateSuiBalances } = useSuiBalances(suiAddress);
  const { mutate: mutateSolanaBalances } = useSolanaBalances(solanaAddress);

  const swap = useCallback(
    async ({ fromType, toType, fromAmount }: SwapParams) => {
      if (!user) {
        toast.error('Please connect your wallet first');
        return;
      }

      const isSuiToSol = fromType === SUI_TYPE_ARG && toType === SOL_TYPE;
      const isSolToSui = fromType === SOL_TYPE && toType === SUI_TYPE_ARG;

      if (!isSuiToSol && !isSolToSui) {
        toast.error('Invalid swap direction');
        return;
      }

      const sourceChain = isSuiToSol ? ChainId.Sui : ChainId.Solana;
      const destinationChain = isSuiToSol ? ChainId.Solana : ChainId.Sui;
      const dwalletAddress = DWalletAddress[sourceChain];

      try {
        setStatus('depositing');
        setError(null);

        let depositDigest: string;

        if (isSuiToSol) {
          if (!suiAddress) {
            throw new Error('Sui wallet not connected');
          }

          const result = await sendSui({
            userId: user.id,
            recipient: dwalletAddress,
            amount: fromAmount.toString(),
          });

          depositDigest = result.digest;

          await suiClient.waitForTransaction({
            digest: depositDigest,
            options: { showEffects: true },
          });
        } else {
          if (!solanaAddress) {
            throw new Error('Solana wallet not connected');
          }

          const result = await sendSolana({
            userId: user.id,
            recipient: dwalletAddress,
            amount: fromAmount.toString(),
          });

          depositDigest = result.signature;

          await solanaConnection.confirmTransaction(depositDigest, 'confirmed');
        }

        toast.success('Deposit confirmed!');

        setStatus('verifying');

        const proof = await fetchNewRequestProof(depositDigest, sourceChain);

        toast.success('Deposit verified!');

        setStatus('creating');

        const metadata = await fetchMetadata();
        const solverSuiAddress = metadata.solver.sui;
        const solverSolanaAddress = metadata.solver.solana;

        const destinationAddress = isSuiToSol
          ? SolanaPubkey.fromBs58(solanaAddress!).toBytes()
          : SuiAddress.fromHex(suiAddress!).toBytes();
        const solverSender = isSuiToSol
          ? SolanaPubkey.fromBs58(solverSolanaAddress).toBytes()
          : SuiAddress.fromHex(solverSuiAddress).toBytes();
        const solverRecipient = isSuiToSol
          ? SuiAddress.fromHex(solverSuiAddress).toBytes()
          : SolanaPubkey.fromBs58(solverSolanaAddress).toBytes();
        const destinationToken = isSuiToSol
          ? SolanaPubkey.fromBs58(NATIVE_SOL_MINT).toBytes()
          : new TextEncoder().encode(SUI_TYPE_ARG);
        const sourceAddress = isSuiToSol
          ? SuiAddress.fromHex(suiAddress!).toBytes()
          : SolanaPubkey.fromBs58(solanaAddress!).toBytes();

        const walletKey = WalletKey[sourceChain];
        const deadline = BigInt(Date.now() + REQUEST_DEADLINE_MS);

        await createSwapRequest({
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
          minDestinationAmount: '1',
          minConfirmations: 0,
          deadline: deadline.toString(),
          solverSender: Array.from(solverSender),
          solverRecipient: Array.from(solverRecipient),
        });

        toast.success('Request created! Waiting for solver...');

        setStatus('waiting');

        for (let i = 0; i < BALANCE_POLL_MAX_ATTEMPTS; i++) {
          await new Promise((resolve) =>
            setTimeout(resolve, BALANCE_POLL_INTERVAL_MS)
          );

          if (isSuiToSol) {
            await mutateSolanaBalances();
          } else {
            await mutateSuiBalances();
          }
        }

        setStatus('success');
        toast.success('Swap completed!');
      } catch (err: unknown) {
        setStatus('error');
        const message = err instanceof Error ? err.message : 'Swap failed';
        setError(message);
        toast.error(message);
      }
    },
    [
      user,
      suiAddress,
      solanaAddress,
      suiClient,
      solanaConnection,
      mutateSuiBalances,
      mutateSolanaBalances,
    ]
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
  }, []);

  return {
    swap,
    reset,
    status,
    error,
    isLoading: status !== 'idle' && status !== 'success' && status !== 'error',
  };
};

export default useSwap;
