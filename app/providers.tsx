'use client';

import { usePrivy } from '@privy-io/react-auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { SkeletonTheme } from 'react-loading-skeleton';

import AuthInitializer from '@/components/providers/auth-initializer';
import ErrorBoundary from '@/components/providers/error-boundary';
import GasGuardProvider from '@/components/providers/gas-guard-provider';
import ModalProvider from '@/components/providers/modal-provider';
import PresignGuardProvider from '@/components/providers/presign-guard-provider';
import PrivyProviderWrapper from '@/components/providers/privy-provider';
import SidePanelProvider from '@/components/providers/side-panel-provider';
import ThemeProvider from '@/components/providers/theme-provider';
import WalletRegistrationProvider from '@/components/providers/wallet-registration-provider';
import Spinner from '@/components/ui/spinner';
import { TOAST_DURATION } from '@/constants/toast';
import { Z_INDEX } from '@/constants/z-index';
import { useOnboarding } from '@/hooks/store/use-onboarding';
import useThemeColors from '@/hooks/ui/use-theme-colors';
import OnboardingView from '@/views/onboarding';

const SUCCESS_DELAY_MS = 1_500;

const OnboardingGate = ({ children }: { children: ReactNode }) => {
  const { user, authenticated, ready } = usePrivy();
  const step = useOnboarding((s) => s.step);
  const fromCache = useOnboarding((s) => s._fromCache);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (step !== 'complete') {
      setShowSuccess(false);
      return;
    }
    // Returning users from cache skip the success animation delay
    if (fromCache) {
      setShowSuccess(true);
      return;
    }
    const timer = setTimeout(() => setShowSuccess(true), SUCCESS_DELAY_MS);
    return () => clearTimeout(timer);
  }, [step, fromCache]);

  if (!ready) return null;
  if (!authenticated || !user?.id) return <>{children}</>;
  if (step === 'complete' && showSuccess) return <>{children}</>;

  if (step === 'checking') {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <Spinner size="1.5rem" className="text-accent" />
      </div>
    );
  }

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
        <PresignGuardProvider />
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
