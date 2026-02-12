'use client';

import { usePrivy } from '@privy-io/react-auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { SkeletonTheme } from 'react-loading-skeleton';

import AuthInitializer from '@/components/providers/auth-initializer';
import ErrorBoundary from '@/components/providers/error-boundary';
import GasGuardProvider from '@/components/providers/gas-guard-provider';
import ModalProvider from '@/components/providers/modal-provider';
import PrivyProviderWrapper from '@/components/providers/privy-provider';
import SidePanelProvider from '@/components/providers/side-panel-provider';
import ThemeProvider from '@/components/providers/theme-provider';
import WalletRegistrationProvider from '@/components/providers/wallet-registration-provider';
import { TOAST_DURATION } from '@/constants/toast';
import { Z_INDEX } from '@/constants/z-index';
import { useOnboarding } from '@/hooks/store/use-onboarding';
import useThemeColors from '@/hooks/ui/use-theme-colors';
import OnboardingView from '@/views/onboarding';

const OnboardingGate = ({ children }: { children: ReactNode }) => {
  const { user, authenticated, ready } = usePrivy();
  const step = useOnboarding((s) => s.step);

  if (!ready) return null;
  if (!authenticated || !user?.id) return <>{children}</>;
  if (step === 'complete') return <>{children}</>;
  if (step === 'checking') return null;

  return <OnboardingView />;
};

const ThemedProviders = ({ children }: { children: ReactNode }) => {
  const { toast, skeleton } = useThemeColors();

  return (
    <>
      <AuthInitializer />
      <ModalProvider />
      <SidePanelProvider />
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: TOAST_DURATION,
          style: {
            zIndex: Z_INDEX.TOAST,
            maxWidth: '22rem',
            overflow: 'hidden',
            position: 'relative',
            padding: '0.875rem 1rem',
            background: 'var(--toast-glass-bg)',
            backdropFilter: 'blur(var(--blur-lg)) saturate(1.4)',
            WebkitBackdropFilter: 'blur(var(--blur-lg)) saturate(1.4)',
            border: `1px solid ${toast.border}`,
            borderRadius: '12px',
            boxShadow: `var(--toast-inner-highlight), ${toast.shadow}`,
          },
        }}
      />
      <SkeletonTheme
        baseColor={skeleton.baseColor}
        highlightColor={skeleton.highlightColor}
      >
        <WalletRegistrationProvider />
        <GasGuardProvider />
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
