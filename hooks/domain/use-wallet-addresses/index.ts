import type { ChainKey } from '@/constants/chains';
import { useOnboarding } from '@/hooks/store/use-onboarding';

export interface WalletAddresses {
  addresses: Record<ChainKey, string | null>;
  getAddress: (chain: ChainKey) => string | null;
  hasWallet: (chain: ChainKey) => boolean;
}

export const useWalletAddresses = (): WalletAddresses => {
  const suiAddress = useOnboarding((s) => s.suiAddress);
  const solanaAddress = useOnboarding((s) => s.solanaAddress);

  const addresses: Record<ChainKey, string | null> = {
    sui: suiAddress,
    solana: solanaAddress,
  };

  const getAddress = (chain: ChainKey) => addresses[chain];
  const hasWallet = (chain: ChainKey) => Boolean(addresses[chain]);

  return {
    addresses,
    getAddress,
    hasWallet,
  };
};

export default useWalletAddresses;
