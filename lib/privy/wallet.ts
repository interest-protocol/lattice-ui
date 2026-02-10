import type { PrivyClient } from '@privy-io/node';

export class WalletNotFoundError extends Error {
  constructor(chainType: string) {
    super(`No ${chainType} wallet found`);
    this.name = 'WalletNotFoundError';
  }
}

export const getFirstWallet = async (
  privy: PrivyClient,
  userId: string,
  chainType: 'sui' | 'solana'
) => {
  const wallets = [];
  for await (const wallet of privy.wallets().list({
    user_id: userId,
    chain_type: chainType,
  })) {
    wallets.push(wallet);
  }

  if (wallets.length === 0) throw new WalletNotFoundError(chainType);

  return wallets[0];
};
