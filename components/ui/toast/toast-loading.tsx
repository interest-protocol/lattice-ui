import type { FC } from 'react';
import toast from 'react-hot-toast';
import type { ToastLoadingProps } from './toast.types';
import ToastTimer from './toast-timer';

const ToastLoading: FC<ToastLoadingProps> = ({ message, toastId }) => (
  <div className="flex items-center gap-2 w-full">
    <div className="flex-1">
      <p className="text-text py-2">{message ?? 'Loading...'}</p>
      <ToastTimer loading color="var(--color-text-secondary)" />
    </div>
    {toastId && (
      <button
        type="button"
        aria-label="Dismiss"
        className="flex-shrink-0 w-6 h-6 flex items-center justify-center cursor-pointer bg-transparent border-none text-text-muted hover:text-text transition-colors duration-150 rounded"
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
  </div>
);

export default ToastLoading;
