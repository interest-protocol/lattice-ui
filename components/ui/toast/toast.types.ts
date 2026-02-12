export interface ToastProps {
  action: string;
  message?: string;
}

export interface ToastLoadingProps extends Pick<ToastProps, 'message'> {
  toastId?: string;
}

export interface ToastSuccessProps extends ToastProps {
  link?: string;
}

export interface ToastTimerProps {
  color: string;
  loading?: boolean;
}
