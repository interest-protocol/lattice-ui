import { useQuery } from '@tanstack/react-query';

import { SOL_TYPE } from '@/constants/coins';
import { REFETCH_INTERVALS } from '@/constants/refetch-intervals';
import { fetchCoinPrices } from '@/lib/external/client';

export const useSolPrice = () =>
  useQuery<number>({
    queryKey: ['sol-price'],
    queryFn: async () => {
      const data = await fetchCoinPrices([SOL_TYPE]);
      const price = data[0]?.price;
      if (!price) throw new Error('Failed to fetch SOL price');
      return price;
    },
    refetchInterval: REFETCH_INTERVALS.PRICES,
    refetchOnWindowFocus: false,
    staleTime: 5_000,
  });
