import { usePrivy } from '@privy-io/react-auth';
import { useMemo } from 'react';

import { CHAIN_KEYS, CHAIN_REGISTRY, type ChainKey } from '@/constants/chains';

export interface WalletAddresses {
  addresses: Record<ChainKey, string | null>;
  getAddress: (chain: ChainKey) => string | null;
  hasWallet: (chain: ChainKey) => boolean;
}

const findWalletAddress = (
  linkedAccounts: Array<Record<string, unknown>> | undefined,
  chainKey: ChainKey
): string | null => {
  const config = CHAIN_REGISTRY[chainKey];

  const wallet = linkedAccounts?.find((account) => {
    if (account.type !== 'wallet' || !('address' in account)) return false;

    if (
      'chainType' in account &&
      String(account.chainType).toLowerCase() === config.privyChainType
    )
      return true;

    const addr = account.address;
    if (typeof addr !== 'string') return false;

    const { prefix, lengthRange } = config.addressFormat;
    if (prefix && !addr.startsWith(prefix)) return false;
    if (!prefix && addr.startsWith('0x')) return false;
    return addr.length >= lengthRange[0] && addr.length <= lengthRange[1];
  });

  return wallet && 'address' in wallet ? (wallet.address as string) : null;
};

export const useWalletAddresses = (): WalletAddresses => {
  const { user } = usePrivy();

  return useMemo(() => {
    const accounts = user?.linkedAccounts as
      | Array<Record<string, unknown>>
      | undefined;

    const addresses = Object.fromEntries(
      CHAIN_KEYS.map((key) => [key, findWalletAddress(accounts, key)])
    ) as Record<ChainKey, string | null>;

    const getAddress = (chain: ChainKey) => addresses[chain];
    const hasWallet = (chain: ChainKey) => Boolean(addresses[chain]);

    return {
      addresses,
      getAddress,
      hasWallet,
    };
  }, [user]);
};

export default useWalletAddresses;
