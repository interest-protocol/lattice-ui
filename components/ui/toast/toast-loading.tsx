import { P } from '@stylin.js/elements';
import type { FC } from 'react';

import ToastTimer from './toast-timer';
import type { ToastLoadingProps } from './toast.types';

const ToastLoading: FC<ToastLoadingProps> = ({ message }) => (
  <>
    <P color="#FFFFFF" py="0.5rem">
      {message ?? 'Loading...'}
    </P>
    <ToastTimer loading color="#DDDDDD" />
  </>
);

export default ToastLoading;
