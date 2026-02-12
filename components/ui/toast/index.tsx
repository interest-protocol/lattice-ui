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
    const id = toast.loading(<ToastLoading {...args} />, {
      duration: Number.POSITIVE_INFINITY,
    });
    toast.loading(<ToastLoading {...args} toastId={id} />, {
      id,
      duration: Number.POSITIVE_INFINITY,
    });
    return dismissHandler(id);
  },

  loadingWithId: (args: ToastLoadingProps, id: string) => {
    toast.loading(<ToastLoading {...args} toastId={id} />, {
      id,
      duration: Number.POSITIVE_INFINITY,
    });
    return dismissHandler(id);
  },

  update: (id: string, message: string) => {
    toast.loading(<ToastLoading message={message} toastId={id} />, {
      id,
      duration: Number.POSITIVE_INFINITY,
    });
  },

  dismiss: (id: string) => toast.dismiss(id),
};
