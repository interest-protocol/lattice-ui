import Link from 'next/link';
import type { FC } from 'react';

import { CheckSVG } from '@/components/ui/icons';
import type { ToastProps, ToastSuccessProps } from './toast.types';
import ToastTimer from './toast-timer';

const ToastContent: FC<ToastProps> = ({ action, message }) => (
  <div className="flex items-center gap-3.5">
    <div
      className="w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center"
      style={{
        color: 'var(--color-toast-success)',
        background: 'var(--toast-icon-success-bg)',
        border: '1px solid var(--toast-icon-success-border)',
      }}
    >
      <CheckSVG maxWidth="1.125rem" width="100%" />
    </div>
    <div className="flex flex-col gap-0.5">
      <p className="text-text font-medium text-sm leading-tight">
        {action} Successfully!
      </p>
      {message ? (
        <p className="text-text-secondary text-xs leading-tight">{message}</p>
      ) : null}
    </div>
    <ToastTimer color="var(--color-toast-success)" />
  </div>
);

const ToastSuccess: FC<ToastSuccessProps> = ({ link, ...props }) => {
  if (link)
    return (
      <Link href={link} target="_blank">
        <ToastContent {...props} />
      </Link>
    );

  return <ToastContent {...props} />;
};

export default ToastSuccess;
