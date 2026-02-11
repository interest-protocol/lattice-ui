'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';
import type { FC, PropsWithChildren } from 'react';

import { PRIVY_APP_ID } from '@/lib/config';

const PrivyProviderWrapper: FC<PropsWithChildren> = ({ children }) => (
  <PrivyProvider
    appId={PRIVY_APP_ID}
    config={{
      loginMethods: ['email', 'wallet'],
      appearance: {
        theme: 'dark',
        accentColor: '#0EA5E9',
      },
      embeddedWallets: {
        solana: {
          createOnLogin: 'users-without-wallets',
        },
      },
      externalWallets: {
        solana: {
          connectors: toSolanaWalletConnectors(),
        },
      },
    }}
  >
    {children}
  </PrivyProvider>
);

export default PrivyProviderWrapper;
