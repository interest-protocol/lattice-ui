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
          color: '#F04248',
          boxShadow: '0 0 5rem 1rem #F04248, inset 0 0 1rem 1rem #463846',
        }}
      >
        <span className="w-8 h-8 flex rounded-full items-center justify-center">
          <ErrorSVG maxWidth="1.25rem" width="100%" />
        </span>
      </div>
      <div>
        <p className="text-white">{action} failed!</p>
        {message && <p className="text-[#C8C5C5]">{message}</p>}
      </div>
    </div>
    <ToastTimer color="#F04248" />
  </>
);

export default ToastError;
