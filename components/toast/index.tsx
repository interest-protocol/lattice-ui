import toast from 'react-hot-toast';

import ToastError from './toast-error';
import ToastLoading from './toast-loading';
import ToastSuccess from './toast-success';
import type {
  ToastLoadingProps,
  ToastProps,
  ToastSuccessProps,
} from './toast.types';

const dismissHandler = (toastId: string) => () => toast.dismiss(toastId);

export const toasting = {
  error: (args: ToastProps) => dismissHandler(toast(<ToastError {...args} />)),
  success: (args: ToastSuccessProps) =>
    dismissHandler(toast(<ToastSuccess {...args} />)),
  loading: (args: ToastLoadingProps) =>
    dismissHandler(
      toast.loading(<ToastLoading {...args} />, {
        duration: Number.POSITIVE_INFINITY,
      })
    ),

  // Loading toast with specific ID for updates
  loadingWithId: (args: ToastLoadingProps, id: string) =>
    dismissHandler(
      toast.loading(<ToastLoading {...args} />, {
        id,
        duration: Number.POSITIVE_INFINITY,
      })
    ),

  // Update existing toast message
  update: (id: string, message: string) => {
    toast.loading(<ToastLoading message={message} />, {
      id,
      duration: Number.POSITIVE_INFINITY,
    });
  },

  // Dismiss toast by ID
  dismiss: (id: string) => toast.dismiss(id),
};
