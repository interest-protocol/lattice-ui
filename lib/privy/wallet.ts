import type { PrivyClient } from '@privy-io/node';

import type { ChainKey } from '@/constants/chains';

export class WalletNotFoundError extends Error {
  constructor(chainType: string) {
    super(`No ${chainType} wallet found`);
    this.name = 'WalletNotFoundError';
  }
}

export const getFirstWallet = async (
  privy: PrivyClient,
  userId: string,
  chainType: ChainKey
) => {
  for await (const wallet of privy.wallets().list({
    user_id: userId,
    chain_type: chainType,
  })) {
    return wallet;
  }

  throw new WalletNotFoundError(chainType);
};
