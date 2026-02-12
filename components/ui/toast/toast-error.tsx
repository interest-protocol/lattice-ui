import type { FC } from 'react';

import { ErrorSVG } from '@/components/ui/icons';
import type { ToastProps } from './toast.types';
import ToastTimer from './toast-timer';

const ToastError: FC<ToastProps> = ({ action, message }) => (
  <>
    <div className="flex items-center gap-3.5">
      <div
        className="w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center"
        style={{
          color: 'var(--color-toast-error)',
          background: 'var(--toast-icon-error-bg)',
          border: '1px solid var(--toast-icon-error-border)',
        }}
      >
        <ErrorSVG maxWidth="1.125rem" width="100%" />
      </div>
      <div className="flex flex-col gap-0.5">
        <p className="text-text font-medium text-sm leading-tight">
          {action} failed!
        </p>
        {message ? (
          <p className="text-text-secondary text-xs leading-tight">{message}</p>
        ) : null}
      </div>
    </div>
    <ToastTimer color="var(--color-toast-error)" />
  </>
);

export default ToastError;
