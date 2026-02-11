'use client';

import { motion } from 'motion/react';
import type { FC } from 'react';

import { CheckSVG } from '@/components/ui/icons';
import type { OnboardingStep } from '@/hooks/store/use-onboarding';

const STEPS: readonly { key: OnboardingStep; label: string }[] = [
  { key: 'creating-wallets', label: 'Create' },
  { key: 'funding', label: 'Fund' },
  { key: 'linking', label: 'Link' },
];

const getStepIndex = (step: OnboardingStep): number => {
  switch (step) {
    case 'checking':
    case 'creating-wallets':
      return 0;
    case 'funding':
      return 1;
    case 'linking':
    case 'confirming':
      return 2;
    case 'complete':
      return 3;
  }
};

interface OnboardingStepperProps {
  step: OnboardingStep;
  hasError: boolean;
}

const OnboardingStepper: FC<OnboardingStepperProps> = ({ step, hasError }) => {
  const activeIndex = getStepIndex(step);
  const isComplete = step === 'complete';

  return (
    <ol className="flex items-center w-full px-4 list-none m-0 p-0">
      {STEPS.map((s, i) => {
        const isCompleted = isComplete || activeIndex > i;
        const isActive = !isComplete && activeIndex === i;
        const isErrorStep = hasError && isActive;

        return (
          <li
            key={s.key}
            className="flex items-center flex-1 last:flex-none"
            aria-current={isActive ? 'step' : undefined}
          >
            <div className="flex flex-col items-center gap-1">
              {isCompleted ? (
                <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center">
                  <CheckSVG
                    maxWidth="0.75rem"
                    width="100%"
                    className="text-white"
                  />
                </div>
              ) : isActive ? (
                <motion.div
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{
                    border: `2px solid ${isErrorStep ? 'var(--color-error)' : 'var(--color-accent)'}`,
                    background: isErrorStep
                      ? 'var(--color-error-wash)'
                      : 'var(--color-accent-wash)',
                  }}
                  animate={isErrorStep ? undefined : { scale: [1, 1.15, 1] }}
                  transition={
                    isErrorStep
                      ? undefined
                      : { repeat: Number.POSITIVE_INFINITY, duration: 1.5 }
                  }
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      background: isErrorStep
                        ? 'var(--color-error)'
                        : 'var(--color-accent)',
                    }}
                  />
                </motion.div>
              ) : (
                <div className="w-7 h-7 rounded-full border-2 border-surface-border flex items-center justify-center">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: 'var(--color-text-dimmed)' }}
                  />
                </div>
              )}
              <span
                className="text-xs whitespace-nowrap"
                style={{
                  color: isCompleted
                    ? 'var(--color-accent)'
                    : isActive
                      ? isErrorStep
                        ? 'var(--color-error)'
                        : 'var(--color-text)'
                      : 'var(--color-text-dimmed)',
                }}
              >
                {s.label}
              </span>
            </div>

            {i < STEPS.length - 1 && (
              <div
                className="flex-1 h-px mx-1 self-start mt-3.5"
                style={{
                  background:
                    isComplete || activeIndex > i
                      ? 'var(--color-accent)'
                      : 'var(--color-surface-border)',
                }}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
};

export default OnboardingStepper;
