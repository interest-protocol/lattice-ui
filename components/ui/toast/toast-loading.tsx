import type { FC } from 'react';
import type { ToastLoadingProps } from './toast.types';
import ToastTimer from './toast-timer';

const ToastLoading: FC<ToastLoadingProps> = ({ message }) => (
  <>
    <p className="text-white py-2">{message ?? 'Loading...'}</p>
    <ToastTimer loading color="#DDDDDD" />
  </>
);

export default ToastLoading;
