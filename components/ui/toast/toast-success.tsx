import Link from 'next/link';
import type { FC } from 'react';

import { CheckSVG } from '@/components/ui/icons';
import type { ToastProps, ToastSuccessProps } from './toast.types';
import ToastTimer from './toast-timer';

const ToastContent: FC<ToastProps> = ({ action, message }) => (
  <div className="flex items-center gap-4">
    <div
      className="w-8 h-8 rounded-full"
      style={{
        color: 'var(--color-toast-success)',
        boxShadow: 'var(--toast-success-glow)',
      }}
    >
      <span className="w-8 h-8 flex rounded-full items-center justify-center">
        <CheckSVG maxWidth="1.25rem" width="100%" />
      </span>
    </div>
    <div>
      <p className="text-text">{action} Successfully!</p>
      {message ? <p className="text-text-secondary">{message}</p> : null}
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
