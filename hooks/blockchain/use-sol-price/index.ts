import { useQuery } from '@tanstack/react-query';

import { SOL_TYPE } from '@/constants/coins';
import { fetchCoinPrices } from '@/lib/external/client';

export const useSolPrice = () =>
  useQuery<number>({
    queryKey: [useSolPrice.name],
    queryFn: async () => {
      const data = await fetchCoinPrices([SOL_TYPE]);
      return data[0]?.price ?? 0;
    },
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
    staleTime: 5_000,
  });
