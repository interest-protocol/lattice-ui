'use client';

import { AnimatePresence, motion } from 'motion/react';
import type { FC } from 'react';

import { CheckSVG, LogoSVG } from '@/components/ui/icons';
import Spinner from '@/components/ui/spinner';
import { useOnboarding } from '@/hooks/store/use-onboarding';

import FundingStep from './funding-step';
import OnboardingStepper from './onboarding-stepper';

const stepTransition = { duration: 0.25, ease: 'easeOut' as const };

const OnboardingView: FC = () => {
  const step = useOnboarding((s) => s.step);
  const error = useOnboarding((s) => s.error);
  const retryLink = useOnboarding((s) => s.retryLink);

  const hasError = Boolean(error);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <motion.div
        className="w-full max-w-md flex flex-col items-center gap-6 rounded-2xl p-8"
        style={{
          background: 'var(--card-bg)',
          boxShadow: 'var(--card-shadow)',
          border: '1px solid var(--color-surface-border)',
        }}
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <LogoSVG
          width="100%"
          maxWidth="2.5rem"
          maxHeight="2.5rem"
          className="text-accent"
        />
        <h1 className="text-lg font-semibold text-text">
          Setting Up Your Account
        </h1>

        <OnboardingStepper step={step} hasError={hasError} />

        <div className="w-full min-h-[7rem]">
          <AnimatePresence mode="wait">
            {step === 'creating-wallets' && !hasError && (
              <motion.div
                key="creating"
                className="flex flex-col items-center gap-3 py-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={stepTransition}
              >
                <Spinner size="1.5rem" className="text-accent" />
                <span className="text-sm text-text-muted">
                  Creating your SUI and Solana wallets...
                </span>
              </motion.div>
            )}

            {step === 'funding' && !hasError && (
              <motion.div
                key="funding"
                className="w-full"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={stepTransition}
              >
                <FundingStep />
              </motion.div>
            )}

            {step === 'linking' && !hasError && (
              <motion.div
                key="linking"
                className="flex flex-col items-center gap-3 py-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={stepTransition}
              >
                <Spinner size="1.5rem" className="text-accent" />
                <span className="text-sm text-text-muted">
                  Linking your wallets...
                </span>
              </motion.div>
            )}

            {step === 'complete' && (
              <motion.div
                key="complete"
                className="flex flex-col items-center gap-3 py-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={stepTransition}
              >
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                  <CheckSVG
                    maxWidth="1rem"
                    width="100%"
                    className="text-white"
                  />
                </div>
                <span className="text-sm text-text-muted">You're all set!</span>
              </motion.div>
            )}

            {hasError && (
              <motion.div
                key="error"
                className="flex flex-col items-center gap-3 py-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={stepTransition}
              >
                <span className="text-sm text-error text-center">{error}</span>
                <button
                  type="button"
                  className="px-6 py-2 bg-accent text-white text-sm font-semibold rounded-xl border-none cursor-pointer hover:bg-accent-hover"
                  onClick={() => retryLink?.()}
                >
                  Try Again
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default OnboardingView;
