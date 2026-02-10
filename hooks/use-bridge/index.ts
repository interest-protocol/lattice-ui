import { ChainId, DWalletAddress } from '@interest-protocol/xbridge-sdk';
import { usePrivy } from '@privy-io/react-auth';
import type BigNumber from 'bignumber.js';
import bs58 from 'bs58';
import { useCallback, useState } from 'react';
import { toast } from 'react-hot-toast';

import { WSOL_SUI_TYPE } from '@/constants/bridged-tokens';
import useSolanaBalances from '@/hooks/use-solana-balances';
import useSolanaConnection from '@/hooks/use-solana-connection';
import useSuiBalances from '@/hooks/use-sui-balances';
import useWalletAddresses from '@/hooks/use-wallet-addresses';
import { sendSolana } from '@/lib/wallet/client';
import {
  createMintRequest,
  executeMint,
  setMintDigest,
  voteMint,
} from '@/lib/xbridge/client';

const NATIVE_SOL_MINT = 'So11111111111111111111111111111111111111112';
const SOL_DECIMALS = 9;

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
    async (amount: BigNumber) => {
      if (!user || !solanaAddress || !suiAddress) {
        throw new Error('Wallets not connected');
      }

      const dwalletAddress = DWalletAddress[ChainId.Solana];

      setStatus('depositing');
      const { signature: depositSignature } = await sendSolana({
        userId: user.id,
        recipient: dwalletAddress,
        amount: amount.toString(),
      });

      await solanaConnection.confirmTransaction(depositSignature, 'finalized');
      toast.success('SOL deposited to bridge!');

      setStatus('creating');
      const { requestId, mintCapId } = await createMintRequest({
        userId: user.id,
        sourceChain: ChainId.Solana,
        sourceToken: Array.from(bs58.decode(NATIVE_SOL_MINT)),
        sourceDecimals: SOL_DECIMALS,
        sourceAddress: Array.from(bs58.decode(solanaAddress)),
        sourceAmount: amount.toString(),
        coinType: WSOL_SUI_TYPE.split('<')[1].replace('>', ''),
      });

      if (!requestId || !mintCapId) {
        throw new Error('Failed to get requestId or mintCapId');
      }
      toast.success('Mint request created!');

      setStatus('voting');
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
      toast.success('Request verified by enclave!');

      setStatus('executing');
      await executeMint({
        userId: user.id,
        requestId,
        mintCapId,
      });
      toast.success('wSOL minted successfully!');

      setStatus('waiting');
      await mutateSuiBalances();
    },
    [user, solanaAddress, suiAddress, solanaConnection, mutateSuiBalances]
  );

  const bridge = useCallback(
    async ({ direction, amount }: BridgeParams) => {
      if (!user) {
        toast.error('Please connect your wallet first');
        return;
      }

      try {
        setStatus('idle');
        setError(null);

        switch (direction) {
          case 'sol-to-wsol':
            await bridgeSolToWsol(amount);
            break;
          case 'wsol-to-sol':
            toast.error('wSOL → SOL bridge coming soon');
            return;
          case 'sui-to-wsui':
            toast.error('SUI → wSUI bridge coming soon');
            return;
          case 'wsui-to-sui':
            toast.error('wSUI → SUI bridge coming soon');
            return;
          default:
            throw new Error('Invalid bridge direction');
        }

        setStatus('success');
        toast.success('Bridge completed!');
      } catch (err: unknown) {
        setStatus('error');
        const message = err instanceof Error ? err.message : 'Bridge failed';
        setError(message);
        toast.error(message);
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
