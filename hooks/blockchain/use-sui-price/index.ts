import { SUI_TYPE_ARG } from '@mysten/sui/utils';
import { useQuery } from '@tanstack/react-query';

import { REFETCH_INTERVALS } from '@/constants/refetch-intervals';
import { fetchCoinPrices } from '@/lib/external/client';

export const useSuiPrice = () =>
  useQuery<number>({
    queryKey: ['sui-price'],
    queryFn: async () => {
      const data = await fetchCoinPrices([SUI_TYPE_ARG]);
      const price = data[0]?.price;
      if (!price) throw new Error('Failed to fetch SUI price');
      return price;
    },
    refetchInterval: REFETCH_INTERVALS.PRICES,
    refetchOnWindowFocus: false,
    staleTime: 5_000,
  });
