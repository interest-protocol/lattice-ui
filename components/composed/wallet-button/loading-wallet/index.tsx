import type { FC } from 'react';
import Skeleton from 'react-loading-skeleton';

import { ChevronDownSVG } from '@/components/ui/icons';

const LoadingWallet: FC = () => (
  <button
    type="button"
    disabled
    aria-busy="true"
    className="flex gap-2 bg-accent-1a text-[#F1F1F1] cursor-pointer items-center rounded-xl py-3 sm:py-4 px-3 sm:px-6 border-none"
  >
    <Skeleton width="1.5rem" height="1.5rem" borderRadius="50%" />
    <Skeleton width="5rem" />
    <ChevronDownSVG maxWidth="0.65rem" maxHeight="0.65rem" width="100%" />
  </button>
);

export default LoadingWallet;
