import toast from 'react-hot-toast';
import type {
  ToastLoadingProps,
  ToastProps,
  ToastSuccessProps,
} from './toast.types';
import ToastError from './toast-error';
import ToastLoading from './toast-loading';
import ToastSuccess from './toast-success';

const dismissHandler = (toastId: string) => () => toast.dismiss(toastId);

export const toasting = {
  error: (args: ToastProps) => dismissHandler(toast(<ToastError {...args} />)),
  success: (args: ToastSuccessProps) =>
    dismissHandler(toast(<ToastSuccess {...args} />)),
  loading: (args: ToastLoadingProps) => {
    const id = Math.random().toString(36).slice(2);
    toast(<ToastLoading {...args} toastId={id} />, {
      id,
      duration: Number.POSITIVE_INFINITY,
    });
    return dismissHandler(id);
  },

  loadingWithId: (args: ToastLoadingProps, id: string) => {
    toast(<ToastLoading {...args} toastId={id} />, {
      id,
      duration: Number.POSITIVE_INFINITY,
    });
    return dismissHandler(id);
  },

  update: (id: string, message: string) => {
    toast(<ToastLoading message={message} toastId={id} />, {
      id,
      duration: Number.POSITIVE_INFINITY,
    });
  },

  dismiss: (id: string) => toast.dismiss(id),
};
