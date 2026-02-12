import { usePrivy } from '@privy-io/react-auth';
import { getWallets } from '@wallet-standard/app';

export interface LoginIdentity {
  method: 'email' | 'wallet';
  rawValue: string;
  walletClientType?: string;
  /** Wallet icon data URI from the Wallet Standard registry */
  walletIcon?: string;
}

/**
 * Finds the wallet icon from the Wallet Standard browser registry.
 * This is more reliable than Privy's `useWallets()` because multi-chain wallets
 * like Nightly register under their real name in the standard, while Privy may
 * report them as "phantom" (since Nightly implements the Phantom adapter).
 */
const getWalletIcon = (walletClientType: string): string | undefined => {
  try {
    const { get } = getWallets();
    const registered = get();
    const match = registered.find(
      (w) => w.name.toLowerCase() === walletClientType.toLowerCase()
    );
    return match?.icon;
  } catch {
    return undefined;
  }
};

export const useLoginIdentity = (): LoginIdentity => {
  const { user } = usePrivy();

  if (!user) return { method: 'email', rawValue: 'Logged in' };

  // Check email-based login first
  const email = user.email?.address ?? user.google?.email;
  if (email) return { method: 'email', rawValue: email };

  // Check for external (non-Privy) wallet in linkedAccounts
  const externalWallet = user.linkedAccounts.find(
    (account) =>
      account.type === 'wallet' &&
      account.walletClientType !== 'privy' &&
      account.walletClientType !== 'privy-v2'
  );

  if (externalWallet && externalWallet.type === 'wallet') {
    return {
      method: 'wallet',
      rawValue: externalWallet.address,
      walletClientType: externalWallet.walletClientType,
      walletIcon: getWalletIcon(externalWallet.walletClientType ?? ''),
    };
  }

  return { method: 'email', rawValue: 'Logged in' };
};

export default useLoginIdentity;
