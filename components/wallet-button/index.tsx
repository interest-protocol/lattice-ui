'use client';

import { usePrivy } from '@privy-io/react-auth';
import type { FC } from 'react';

import ConnectWallet from './connect-wallet';
import LoadingWallet from './loading-wallet';
import WalletProfile from './wallet-profile';

const WalletButton: FC = () => {
  const { ready, authenticated, login } = usePrivy();

  if (!ready) return <LoadingWallet />;
  if (authenticated) return <WalletProfile />;
  return (
    <ConnectWallet
      onConnect={() => login({ walletChainType: 'solana-only' })}
    />
  );
};

export default WalletButton;
