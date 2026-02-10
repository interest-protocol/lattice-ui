'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';
import type { FC, PropsWithChildren } from 'react';

const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? '';

const solanaConnectors = toSolanaWalletConnectors();

const PrivyProviderWrapper: FC<PropsWithChildren> = ({ children }) => (
  <PrivyProvider
    appId={appId}
    config={{
      loginMethods: ['email', 'wallet'],
      appearance: {
        theme: 'dark',
        accentColor: '#A78BFA',
      },
      embeddedWallets: {
        solana: {
          createOnLogin: 'users-without-wallets',
        },
      },
      externalWallets: {
        solana: {
          connectors: solanaConnectors,
        },
      },
    }}
  >
    {children}
  </PrivyProvider>
);

export default PrivyProviderWrapper;
