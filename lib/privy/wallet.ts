import type { PrivyClient } from '@privy-io/node';

import type { ChainKey } from '@/constants/chains';
import { withTimeout } from '@/lib/api/with-timeout';

export class WalletNotFoundError extends Error {
  constructor(chainType: string) {
    super(`No ${chainType} wallet found`);
    this.name = 'WalletNotFoundError';
  }
}

// biome-ignore lint/suspicious/noExplicitAny: dedup map for concurrent getOrCreateWallet calls
const pendingCreations = new Map<string, Promise<any>>();

export const walletIdKey = (chain: ChainKey) => `${chain}WalletId`;
export const walletAddressKey = (chain: ChainKey) => `${chain}Address`;

export const storeWalletMetadata = async (
  privy: PrivyClient,
  userId: string,
  chainType: ChainKey,
  wallet: { id: string; address: string }
) => {
  const user = await privy.users()._get(userId);
  const existing = user.custom_metadata ?? {};

  if (typeof existing[walletIdKey(chainType)] === 'string') return;

  await privy.users().setCustomMetadata(userId, {
    custom_metadata: {
      ...existing,
      [walletIdKey(chainType)]: wallet.id,
      [walletAddressKey(chainType)]: wallet.address,
    },
  });
};

export const getFirstWallet = async (
  privy: PrivyClient,
  userId: string,
  chainType: ChainKey
) => {
  const user = await privy.users()._get(userId);
  const walletId = user.custom_metadata?.[walletIdKey(chainType)];
  if (typeof walletId === 'string') {
    return privy.wallets().get(walletId);
  }
  throw new WalletNotFoundError(chainType);
};

export const getOrCreateWallet = async (
  privy: PrivyClient,
  userId: string,
  chainType: ChainKey
) => {
  const dedupKey = `${userId}:${chainType}`;
  const inflight = pendingCreations.get(dedupKey);
  if (inflight) return inflight;

  const promise = (async () => {
    const user = await privy.users()._get(userId);
    const walletId = user.custom_metadata?.[walletIdKey(chainType)];
    if (typeof walletId === 'string') {
      return privy.wallets().get(walletId);
    }

    const wallet = await privy.wallets().create({ chain_type: chainType });

    // Retry metadata storage to prevent orphaned wallets if the first
    // attempt fails (e.g. transient network error after wallet creation).
    let lastErr: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await storeWalletMetadata(privy, userId, chainType, wallet);
        lastErr = null;
        break;
      } catch (err) {
        lastErr = err;
        if (attempt < 2)
          await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      }
    }
    if (lastErr) throw lastErr;

    // Post-write verification: re-read metadata to detect race condition
    // where another concurrent request stored a different wallet first.
    // Wrapped in a timeout so a slow Privy response doesn't hang indefinitely —
    // the primary metadata write already succeeded, so we can safely return
    // the wallet if verification times out.
    try {
      const verifyUser = await withTimeout(
        privy.users()._get(userId),
        10_000,
        'Post-write verification'
      );
      const storedId = verifyUser.custom_metadata?.[walletIdKey(chainType)];
      if (typeof storedId === 'string' && storedId !== wallet.id) {
        return privy.wallets().get(storedId);
      }
    } catch {
      // Timeout or transient failure — metadata was already written,
      // so return the wallet we created.
    }

    return wallet;
  })();

  pendingCreations.set(dedupKey, promise);
  try {
    return await promise;
  } finally {
    pendingCreations.delete(dedupKey);
  }
};
