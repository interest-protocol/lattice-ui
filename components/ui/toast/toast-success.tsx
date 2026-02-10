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
        color: '#00DF80',
        boxShadow: '0 0 5rem 1rem #00DF80, inset 0 0 1rem 1rem #2C4A47',
      }}
    >
      <span className="w-8 h-8 flex rounded-full items-center justify-center">
        <CheckSVG maxWidth="1.25rem" width="100%" />
      </span>
    </div>
    <div>
      <p className="text-white">{action} Successfully!</p>
      {message && <p className="text-[#C8C5C5]">{message}</p>}
    </div>
    <ToastTimer color="#00DF80" />
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
