import type { FC } from 'react';

import { ErrorSVG } from '@/components/ui/icons';
import type { ToastProps } from './toast.types';
import ToastTimer from './toast-timer';

const ToastError: FC<ToastProps> = ({ action, message }) => (
  <>
    <div className="flex items-center gap-4">
      <div
        className="w-8 h-8 rounded-full"
        style={{
          color: 'var(--color-toast-error)',
          boxShadow: 'var(--toast-error-glow)',
        }}
      >
        <span className="w-8 h-8 flex rounded-full items-center justify-center">
          <ErrorSVG maxWidth="1.25rem" width="100%" />
        </span>
      </div>
      <div>
        <p className="text-text">{action} failed!</p>
        {message && <p className="text-text-secondary">{message}</p>}
      </div>
    </div>
    <ToastTimer color="var(--color-toast-error)" />
  </>
);

export default ToastError;
