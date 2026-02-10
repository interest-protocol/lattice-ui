import { ChainId, DWalletAddress } from '@interest-protocol/xbridge-sdk';
import { usePrivy } from '@privy-io/react-auth';
import type BigNumber from 'bignumber.js';
import bs58 from 'bs58';
import { useCallback, useState } from 'react';
import invariant from 'tiny-invariant';

import { toasting } from '@/components/ui/toast';
import { WSOL_SUI_TYPE } from '@/constants/bridged-tokens';
import { NATIVE_SOL_MINT, SOL_DECIMALS } from '@/constants/coins';
import useSolanaBalances from '@/hooks/blockchain/use-solana-balances';
import useSolanaConnection from '@/hooks/blockchain/use-solana-connection';
import useSuiBalances from '@/hooks/blockchain/use-sui-balances';
import useWalletAddresses from '@/hooks/domain/use-wallet-addresses';
import { confirmSolanaTransaction } from '@/lib/solana/confirm-transaction';
import { sendSolana } from '@/lib/wallet/client';
import {
  createMintRequest,
  executeMint,
  setMintDigest,
  voteMint,
} from '@/lib/xbridge/client';
import { extractErrorMessage } from '@/utils';

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
  amount: BigNumber;
}

export const useBridge = () => {
  const { user } = usePrivy();
  const [status, setStatus] = useState<BridgeStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const solanaConnection = useSolanaConnection();
  const { suiAddress, solanaAddress } = useWalletAddresses();

  const { mutate: mutateSuiBalances } = useSuiBalances(suiAddress);
  useSolanaBalances(solanaAddress);

  const bridgeSolToWsol = useCallback(
    async (amount: BigNumber, toastId: string) => {
      invariant(user && solanaAddress && suiAddress, 'Wallets not connected');

      const dwalletAddress = DWalletAddress[ChainId.Solana];

      setStatus('depositing');
      toasting.update(toastId, 'Depositing to bridge...');
      const { signature: depositSignature } = await sendSolana({
        userId: user.id,
        recipient: dwalletAddress,
        amount: amount.toString(),
      });

      await confirmSolanaTransaction(solanaConnection, depositSignature);

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

      setStatus('voting');
      toasting.update(toastId, 'Verifying with enclave...');
      await setMintDigest({
        userId: user.id,
        requestId,
        mintCapId,
        depositSignature,
      });

      await voteMint({
        userId: user.id,
        requestId,
        depositSignature,
      });

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
    },
    [user, solanaAddress, suiAddress, solanaConnection, mutateSuiBalances]
  );

  const bridge = useCallback(
    async ({ direction, amount }: BridgeParams) => {
      const BRIDGE_TOAST_ID = 'bridge-operation';

      if (!user) {
        toasting.error({
          action: 'Bridge',
          message: 'Please connect your wallet first',
        });
        return;
      }

      try {
        setStatus('idle');
        setError(null);
        toasting.loadingWithId(
          { message: 'Starting bridge...' },
          BRIDGE_TOAST_ID
        );

        switch (direction) {
          case 'sol-to-wsol':
            await bridgeSolToWsol(amount, BRIDGE_TOAST_ID);
            break;
          case 'wsol-to-sol':
            toasting.dismiss(BRIDGE_TOAST_ID);
            toasting.error({
              action: 'Bridge',
              message: 'wSOL → SOL bridge coming soon',
            });
            return;
          case 'sui-to-wsui':
            toasting.dismiss(BRIDGE_TOAST_ID);
            toasting.error({
              action: 'Bridge',
              message: 'SUI → wSUI bridge coming soon',
            });
            return;
          case 'wsui-to-sui':
            toasting.dismiss(BRIDGE_TOAST_ID);
            toasting.error({
              action: 'Bridge',
              message: 'wSUI → SUI bridge coming soon',
            });
            return;
          default:
            throw new Error('Invalid bridge direction');
        }

        setStatus('success');
        toasting.dismiss(BRIDGE_TOAST_ID);
        toasting.success({
          action: 'Bridge',
          message: 'Your tokens are ready',
        });
      } catch (err: unknown) {
        setStatus('error');
        const message = extractErrorMessage(err, 'Bridge failed');
        setError(message);
        toasting.dismiss(BRIDGE_TOAST_ID);
        toasting.error({ action: 'Bridge', message: `Failed: ${message}` });
      }
    },
    [user, bridgeSolToWsol]
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
  }, []);

  return {
    bridge,
    reset,
    status,
    error,
    isLoading: status !== 'idle' && status !== 'success' && status !== 'error',
  };
};

export default useBridge;
