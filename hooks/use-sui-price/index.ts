import { SUI_TYPE_ARG } from '@mysten/sui/utils';
import useSWR from 'swr';

import { fetchCoinPrices } from '@/lib/external/client';

export const useSuiPrice = () =>
  useSWR<number>([useSuiPrice.name], async () => {
    const data = await fetchCoinPrices([SUI_TYPE_ARG]);
    return data[0]?.price ?? 0;
  });
