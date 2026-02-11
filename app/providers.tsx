'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { SkeletonTheme } from 'react-loading-skeleton';

import { BackgroundProvider } from '@/components';
import AppStateProvider from '@/components/providers/app-state-provider';
import AuthInitializer from '@/components/providers/auth-initializer';
import ErrorBoundary from '@/components/providers/error-boundary';
import GasGuardProvider from '@/components/providers/gas-guard-provider';
import ModalProvider from '@/components/providers/modal-provider';
import PrivyProviderWrapper from '@/components/providers/privy-provider';
import ThemeProvider from '@/components/providers/theme-provider';
import WalletRegistrationProvider from '@/components/providers/wallet-registration-provider';
import { TOAST_DURATION } from '@/constants/toast';
import useThemeColors from '@/hooks/ui/use-theme-colors';

const ThemedProviders = ({ children }: { children: ReactNode }) => {
  const { toast, skeleton } = useThemeColors();

  return (
    <>
      <AuthInitializer />
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
            background: toast.background,
            border: `1px solid ${toast.border}`,
            borderRadius: '12px',
            boxShadow: toast.shadow,
          },
        }}
      />
      <SkeletonTheme
        baseColor={skeleton.baseColor}
        highlightColor={skeleton.highlightColor}
      >
        <AppStateProvider />
        <WalletRegistrationProvider />
        <GasGuardProvider />
        <BackgroundProvider />
        {children}
      </SkeletonTheme>
    </>
  );
};

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
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <PrivyProviderWrapper>
            <ThemedProviders>{children}</ThemedProviders>
          </PrivyProviderWrapper>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default Providers;
