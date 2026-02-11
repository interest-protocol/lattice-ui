'use client';

import { usePrivy } from '@privy-io/react-auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { SkeletonTheme } from 'react-loading-skeleton';
import { useLocalStorage } from 'usehooks-ts';

import { BackgroundProvider } from '@/components';
import AuthInitializer from '@/components/providers/auth-initializer';
import ErrorBoundary from '@/components/providers/error-boundary';
import GasGuardProvider from '@/components/providers/gas-guard-provider';
import ModalProvider from '@/components/providers/modal-provider';
import PrivyProviderWrapper from '@/components/providers/privy-provider';
import ThemeProvider from '@/components/providers/theme-provider';
import WalletRegistrationProvider from '@/components/providers/wallet-registration-provider';
import { WALLETS_LINKED_KEY } from '@/constants/storage-keys';
import { TOAST_DURATION } from '@/constants/toast';
import useThemeColors from '@/hooks/ui/use-theme-colors';
import OnboardingView from '@/views/onboarding';

type LinkedUsers = Record<string, boolean>;

const OnboardingGate = ({ children }: { children: ReactNode }) => {
  const { user, authenticated, ready } = usePrivy();
  const [mounted, setMounted] = useState(false);
  const [linkedUsers] = useLocalStorage<LinkedUsers>(WALLETS_LINKED_KEY, {});

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent flash: wait for mount + Privy ready
  if (!mounted || !ready) return null;

  // Not authenticated — show normal app (login button)
  if (!authenticated || !user?.id) return <>{children}</>;

  // Already linked — show normal app
  if (linkedUsers[user.id]) return <>{children}</>;

  // Onboarding in progress
  return <OnboardingView />;
};

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
        <WalletRegistrationProvider />
        <GasGuardProvider />
        <BackgroundProvider />
        <OnboardingGate>{children}</OnboardingGate>
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
