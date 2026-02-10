import { SolanaPubkey, SuiAddress } from '@interest-protocol/registry-sdk';
import {
  ChainId,
  DWalletAddress,
  WalletKey,
} from '@interest-protocol/xswap-sdk';
import { SUI_TYPE_ARG } from '@mysten/sui/utils';
import { usePrivy } from '@privy-io/react-auth';
import type BigNumber from 'bignumber.js';
import { useCallback, useRef, useState } from 'react';
import invariant from 'tiny-invariant';

import { toasting } from '@/components/toast';
import {
  BALANCE_POLL_INTERVAL_MS,
  BALANCE_POLL_MAX_ATTEMPTS,
  NATIVE_SOL_MINT,
  REQUEST_DEADLINE_MS,
  SOL_TYPE,
} from '@/constants/coins';
import useSolanaBalances from '@/hooks/use-solana-balances';
import useSolanaConnection from '@/hooks/use-solana-connection';
import useSuiBalances from '@/hooks/use-sui-balances';
import useSuiClient from '@/hooks/use-sui-client';
import useWalletAddresses from '@/hooks/use-wallet-addresses';
import { fetchNewRequestProof } from '@/lib/enclave/client';
import { fetchMetadata } from '@/lib/solver/client';
import { sendSolana, sendSui } from '@/lib/wallet/client';
import { createSwapRequest } from '@/lib/xswap/client';

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
  const { suiAddress, solanaAddress } = useWalletAddresses();

  const { balances: suiBalances, mutate: mutateSuiBalances } =
    useSuiBalances(suiAddress);
  const { balances: solanaBalances, mutate: mutateSolanaBalances } =
    useSolanaBalances(solanaAddress);

  const suiBalancesRef = useRef(suiBalances);
  suiBalancesRef.current = suiBalances;
  const solanaBalancesRef = useRef(solanaBalances);
  solanaBalancesRef.current = solanaBalances;

  const swap = useCallback(
    async ({ fromType, toType, fromAmount }: SwapParams) => {
      const SWAP_TOAST_ID = 'swap-operation';

      if (!user) {
        toasting.error({
          action: 'Swap',
          message: 'Please connect your wallet first',
        });
        return;
      }

      const isSuiToSol = fromType === SUI_TYPE_ARG && toType === SOL_TYPE;
      const isSolToSui = fromType === SOL_TYPE && toType === SUI_TYPE_ARG;

      if (!isSuiToSol && !isSolToSui) {
        toasting.error({ action: 'Swap', message: 'Invalid swap direction' });
        return;
      }

      const sourceChain = isSuiToSol ? ChainId.Sui : ChainId.Solana;
      const destinationChain = isSuiToSol ? ChainId.Solana : ChainId.Sui;
      const dwalletAddress = DWalletAddress[sourceChain];

      try {
        setStatus('depositing');
        setError(null);
        toasting.loadingWithId(
          { message: 'Depositing funds to bridge...' },
          SWAP_TOAST_ID
        );

        let depositDigest: string;

        if (isSuiToSol) {
          invariant(suiAddress, 'Sui wallet not connected');

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
          invariant(solanaAddress, 'Solana wallet not connected');

          const result = await sendSolana({
            userId: user.id,
            recipient: dwalletAddress,
            amount: fromAmount.toString(),
          });

          depositDigest = result.signature;

          const latestBlockhash = await solanaConnection.getLatestBlockhash();
          await solanaConnection.confirmTransaction({
            signature: depositDigest,
            blockhash: latestBlockhash.blockhash,
            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
          });
        }

        setStatus('verifying');
        toasting.update(SWAP_TOAST_ID, 'Verifying deposit on-chain...');

        const proof = await fetchNewRequestProof(depositDigest, sourceChain);

        setStatus('creating');
        toasting.update(SWAP_TOAST_ID, 'Creating swap request...');

        const metadata = await fetchMetadata();
        const solverSuiAddress = metadata.solver.sui;
        const solverSolanaAddress = metadata.solver.solana;

        invariant(
          suiAddress && solanaAddress,
          'Both wallets must be connected'
        );

        const destinationAddress = isSuiToSol
          ? SolanaPubkey.fromBs58(solanaAddress).toBytes()
          : SuiAddress.fromHex(suiAddress).toBytes();
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
          ? SuiAddress.fromHex(suiAddress).toBytes()
          : SolanaPubkey.fromBs58(solanaAddress).toBytes();

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

        setStatus('waiting');
        toasting.update(SWAP_TOAST_ID, 'Waiting for solver to complete...');

        const initialBalance = isSuiToSol
          ? solanaBalancesRef.current.sol
          : suiBalancesRef.current.sui;

        for (let i = 0; i < BALANCE_POLL_MAX_ATTEMPTS; i++) {
          await new Promise((resolve) =>
            setTimeout(resolve, BALANCE_POLL_INTERVAL_MS)
          );

          let currentBalance: BigNumber | undefined;
          if (isSuiToSol) {
            const newBalances = await mutateSolanaBalances();
            currentBalance = newBalances?.sol;
          } else {
            const newBalances = await mutateSuiBalances();
            currentBalance = newBalances?.sui;
          }

          if (currentBalance && !currentBalance.eq(initialBalance)) {
            break;
          }
        }

        setStatus('success');
        toasting.dismiss(SWAP_TOAST_ID);
        toasting.success({
          action: 'Swap',
          message: 'Your tokens have been exchanged',
        });
      } catch (err: unknown) {
        setStatus('error');
        const message = err instanceof Error ? err.message : 'Swap failed';
        setError(message);
        toasting.dismiss(SWAP_TOAST_ID);
        toasting.error({ action: 'Swap', message: `Failed: ${message}` });
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
