'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { FC, PropsWithChildren } from 'react';

const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? '';

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
    }}
  >
    {children}
  </PrivyProvider>
);

export default PrivyProviderWrapper;
