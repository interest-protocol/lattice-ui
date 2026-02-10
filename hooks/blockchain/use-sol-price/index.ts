import useSWR from 'swr';

import { SOL_TYPE } from '@/constants/coins';
import { fetchCoinPrices } from '@/lib/external/client';
import { priceSwrConfig } from '@/lib/swr/config';

export const useSolPrice = () =>
  useSWR<number>(
    [useSolPrice.name],
    async () => {
      const data = await fetchCoinPrices([SOL_TYPE]);
      return data[0]?.price ?? 0;
    },
    priceSwrConfig
  );
