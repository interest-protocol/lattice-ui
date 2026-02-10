'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { type ReactNode, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { SkeletonTheme } from 'react-loading-skeleton';

import { BackgroundProvider } from '@/components';
import AppStateProvider from '@/components/providers/app-state-provider';
import ErrorBoundary from '@/components/providers/error-boundary';
import ModalProvider from '@/components/providers/modal-provider';
import WalletRegistrationProvider from '@/components/providers/wallet-registration-provider';
import { TOAST_DURATION } from '@/constants/toast';

const PrivyProviderWrapper = dynamic(
  import('@/components/providers/privy-provider').then((m) => m.default),
  { ssr: false }
);

const Providers = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 5_000,
          },
        },
      })
  );

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <PrivyProviderWrapper>
          <ModalProvider />
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: TOAST_DURATION,
              style: {
                zIndex: 100,
                maxWidth: '20rem',
                overflow: 'hidden',
                position: 'relative',
                background: '#242C32',
                boxShadow:
                  '0px 16px 24px 0px rgba(0, 0, 0, 0.14), 0px 6px 30px 0px rgba(0, 0, 0, 0.12), 0px 8px 10px 0px rgba(0, 0, 0, 0.20)',
              },
            }}
          />
          <SkeletonTheme baseColor="#FFFFFF0D" highlightColor="#FFFFFF1A">
            <AppStateProvider />
            <WalletRegistrationProvider />
            <BackgroundProvider />
            {children}
          </SkeletonTheme>
        </PrivyProviderWrapper>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default Providers;
