import { motion } from 'motion/react';
import type { FC } from 'react';
import toast from 'react-hot-toast';
import type { ToastLoadingProps } from './toast.types';
import ToastTimer from './toast-timer';

const ToastLoading: FC<ToastLoadingProps> = ({ message, toastId }) => (
  <div className="flex items-center gap-3.5 w-full">
    <motion.div
      className="w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center"
      style={{
        background: 'var(--toast-icon-loading-bg)',
        border: '1px solid var(--toast-icon-loading-border)',
      }}
      animate={{
        scale: [1, 1.1, 1],
        opacity: [0.7, 1, 0.7],
      }}
      transition={{
        duration: 2,
        ease: 'easeInOut',
        repeat: Number.POSITIVE_INFINITY,
      }}
    >
      <svg
        aria-hidden="true"
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        className="animate-spin"
        style={{ animationDuration: '1.2s' }}
      >
        <circle
          cx="9"
          cy="9"
          r="7"
          stroke="var(--color-accent-muted)"
          strokeWidth="2"
        />
        <circle
          cx="9"
          cy="9"
          r="7"
          stroke="var(--color-accent)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="32"
          strokeDashoffset="24"
        />
      </svg>
    </motion.div>
    <div className="flex-1">
      <p className="text-text font-medium text-sm leading-tight">
        {message ?? 'Loading...'}
      </p>
    </div>
    {toastId && (
      <button
        type="button"
        aria-label="Dismiss"
        className="flex-shrink-0 w-7 h-7 flex items-center justify-center cursor-pointer bg-surface-light border border-surface-border text-text-muted hover:text-text hover:bg-surface-hover transition-colors duration-150 rounded-lg focus-ring"
        onClick={() => toast.dismiss(toastId)}
      >
        <svg
          aria-hidden="true"
          width="10"
          height="10"
          viewBox="0 0 14 14"
          fill="none"
        >
          <path
            d="M1 1l12 12M13 1L1 13"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    )}
    <ToastTimer loading color="var(--color-text-secondary)" />
  </div>
);

export default ToastLoading;
