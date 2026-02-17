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
import { REGISTRATION_CACHE_KEY } from '@/constants/storage-keys';
import { TOAST_DURATION } from '@/constants/toast';
import { Z_INDEX } from '@/constants/z-index';
import { useOnboarding } from '@/hooks/store/use-onboarding';
import useThemeColors from '@/hooks/ui/use-theme-colors';
import OnboardingView from '@/views/onboarding';

const SUCCESS_DELAY_MS = 1_500;

const OnboardingGate = ({ children }: { children: ReactNode }) => {
  const { user, authenticated, ready } = usePrivy();
  const step = useOnboarding((s) => s.step);
  const completedViaOnboarding = useOnboarding(
    (s) => s._completedViaOnboarding
  );
  const [showSuccess, setShowSuccess] = useState(false);

  // Read localStorage once on mount to detect returning users
  const [cachedUser] = useState(() => {
    try {
      const raw = localStorage.getItem(REGISTRATION_CACHE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return Object.values(parsed).some(
        (v) =>
          typeof v === 'object' &&
          v !== null &&
          'linked' in v &&
          (v as { linked: boolean }).linked
      );
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (step !== 'complete' || !completedViaOnboarding) {
      setShowSuccess(false);
      return;
    }
    // Only new onboards get the success animation delay
    const timer = setTimeout(() => setShowSuccess(true), SUCCESS_DELAY_MS);
    return () => clearTimeout(timer);
  }, [step, completedViaOnboarding]);

  // Privy loading — show children for cached users, nothing otherwise
  if (!ready) return cachedUser ? children : null;

  // Not logged in — show children (swap with login button)
  if (!authenticated || !user?.id) return <>{children}</>;

  // Returning registered user — immediate pass-through (no delay, no onboarding UI)
  if (step === 'complete' && !completedViaOnboarding) return <>{children}</>;

  // New user who just finished onboarding — wait for success animation
  if (step === 'complete' && showSuccess) return <>{children}</>;

  // Cached user still checking — show children (skip spinner, server validates in background)
  if (step === 'checking' && cachedUser) return <>{children}</>;

  // Non-cached user checking — show spinner
  if (step === 'checking') {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <Spinner size="1.5rem" className="text-accent" />
      </div>
    );
  }

  // Active onboarding flow (creating-wallets, funding, linking, confirming, complete+showSuccess pending)
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
