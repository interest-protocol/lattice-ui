'use client';

import { AnimatePresence, motion } from 'motion/react';
import type { FC } from 'react';

import { CheckSVG } from '@/components/ui/icons';
import type { BridgeStatus } from '@/hooks/domain/use-bridge';

import type { BridgeProgressStepperProps } from './bridge.types';

const BRIDGE_STEPS: readonly { status: BridgeStatus; label: string }[] = [
  { status: 'depositing', label: 'Deposit' },
  { status: 'creating', label: 'Create' },
  { status: 'voting', label: 'Verify' },
  { status: 'executing', label: 'Mint' },
  { status: 'waiting', label: 'Confirm' },
];

const STATUS_INDEX: Record<string, number> = {
  depositing: 0,
  creating: 1,
  voting: 2,
  executing: 3,
  waiting: 4,
  success: 5,
  error: -1,
};

const STATUS_MESSAGES: Record<string, string> = {
  depositing: 'Depositing to bridge...',
  creating: 'Creating mint request...',
  voting: 'Verifying with enclave...',
  executing: 'Minting tokens...',
  waiting: 'Confirming transaction...',
  success: 'Bridge completed!',
  error: 'Bridge failed',
};

const BridgeProgressStepper: FC<BridgeProgressStepperProps> = ({
  status,
  onRetry,
}) => {
  const activeIndex = STATUS_INDEX[status] ?? -1;
  const isSuccess = status === 'success';
  const isError = status === 'error';

  return (
    <AnimatePresence>
      <motion.div
        className="flex flex-col items-center gap-4 py-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center w-full px-2">
          {BRIDGE_STEPS.map((step, i) => {
            const isCompleted = isSuccess || activeIndex > i;
            const isActive = !isSuccess && activeIndex === i;
            const isErrorStep = isError && activeIndex === -1 && i === 0;

            return (
              <div
                key={step.status}
                className="flex items-center flex-1 last:flex-none"
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
                  ) : isActive || isErrorStep ? (
                    <motion.div
                      className="w-7 h-7 rounded-full flex items-center justify-center"
                      style={{
                        border: `2px solid ${isErrorStep ? 'var(--color-error)' : 'var(--color-accent)'}`,
                        background: isErrorStep
                          ? 'var(--color-error-wash)'
                          : 'var(--color-accent-wash)',
                      }}
                      animate={
                        isErrorStep ? undefined : { scale: [1, 1.15, 1] }
                      }
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
                        style={{
                          background: 'var(--color-text-dimmed)',
                        }}
                      />
                    </div>
                  )}
                  <span
                    className="text-xs whitespace-nowrap"
                    style={{
                      color: isCompleted
                        ? 'var(--color-accent)'
                        : isActive
                          ? 'var(--color-text)'
                          : isErrorStep
                            ? 'var(--color-error)'
                            : 'var(--color-text-dimmed)',
                    }}
                  >
                    {step.label}
                  </span>
                </div>

                {i < BRIDGE_STEPS.length - 1 && (
                  <div
                    className="flex-1 h-px mx-1 self-start mt-3.5"
                    style={{
                      background:
                        isSuccess || activeIndex > i
                          ? 'var(--color-accent)'
                          : 'var(--color-surface-border)',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        <span
          className="text-sm"
          style={{
            color: isError ? 'var(--color-error)' : 'var(--color-text-muted)',
          }}
        >
          {STATUS_MESSAGES[status] ?? ''}
        </span>

        {isError && (
          <button
            type="button"
            className="px-6 py-2 bg-accent text-white text-sm font-semibold rounded-xl border-none cursor-pointer hover:bg-accent-hover"
            onClick={onRetry}
          >
            Try Again
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default BridgeProgressStepper;
