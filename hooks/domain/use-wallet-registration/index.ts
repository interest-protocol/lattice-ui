import { usePrivy, useUser } from '@privy-io/react-auth';
import { useEffect } from 'react';

import useWalletAddresses from '@/hooks/domain/use-wallet-addresses';
import {
  isUserLinked,
  isUserRegistered,
  useOnboarding,
} from '@/hooks/store/use-onboarding';

const useWalletRegistration = () => {
  const { user, authenticated, ready } = usePrivy();
  const { refreshUser } = useUser();
  const { hasWallet, getAddress } = useWalletAddresses();

  const hasSuiWallet = hasWallet('sui');
  const hasSolanaWallet = hasWallet('solana');
  const suiAddress = getAddress('sui');

  useEffect(() => {
    if (!ready || !authenticated || !user?.id) return;

    const userId = user.id;
    useOnboarding.setState({ userId });

    if (isUserLinked(userId)) return;

    if (isUserRegistered(userId)) {
      const { step } = useOnboarding.getState();
      if (step !== 'creating-wallets') return;

      if (suiAddress) useOnboarding.setState({ suiAddress });
      useOnboarding.setState({ step: 'funding', error: null });
      return;
    }

    useOnboarding.getState().registerWallets({
      userId,
      hasSuiWallet,
      hasSolanaWallet,
      existingSuiAddress: suiAddress,
      refreshUser,
    });

    return () => useOnboarding.getState().cleanup();
  }, [
    ready,
    authenticated,
    user?.id,
    hasSuiWallet,
    hasSolanaWallet,
    suiAddress,
    refreshUser,
  ]);
};

export default useWalletRegistration;
