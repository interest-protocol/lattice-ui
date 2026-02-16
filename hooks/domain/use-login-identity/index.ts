import { usePrivy } from '@privy-io/react-auth';
import { getWallets } from '@wallet-standard/app';

export interface LoginIdentity {
  method: 'email' | 'wallet';
  rawValue: string;
  walletClientType?: string;
  walletIcon?: string;
}

const getWalletIcon = (walletClientType: string): string | undefined => {
  try {
    const { get } = getWallets();
    const registered = get();
    const match = registered.find(
      (w) => w.name.toLowerCase() === walletClientType.toLowerCase()
    );
    return match?.icon;
  } catch (err) {
    console.warn('[login-identity] Failed to resolve wallet icon:', err);
    return undefined;
  }
};

export const useLoginIdentity = (): LoginIdentity => {
  const { user } = usePrivy();

  if (!user) return { method: 'email', rawValue: 'Logged in' };

  const email = user.email?.address ?? user.google?.email;
  if (email) return { method: 'email', rawValue: email };

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
