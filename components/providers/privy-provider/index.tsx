'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';
import type { FC, PropsWithChildren } from 'react';

import { PRIVY_APP_ID } from '@/lib/config';

const SOLANA_CONNECTORS = toSolanaWalletConnectors();

const PrivyProviderWrapper: FC<PropsWithChildren> = ({ children }) => (
  <PrivyProvider
    appId={PRIVY_APP_ID}
    config={{
      loginMethods: ['email', 'wallet'],
      appearance: {
        theme: 'dark',
        accentColor: '#a78bfa',
      },
      embeddedWallets: {
        ethereum: {
          createOnLogin: 'off',
        },
        solana: {
          createOnLogin: 'off',
        },
      },
      externalWallets: {
        solana: {
          connectors: SOLANA_CONNECTORS,
        },
      },
    }}
  >
    {children}
  </PrivyProvider>
);

export default PrivyProviderWrapper;
