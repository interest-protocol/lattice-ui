import { SUI_TYPE_ARG } from '@mysten/sui/utils';
import { useQuery } from '@tanstack/react-query';

import { fetchCoinPrices } from '@/lib/external/client';

export const useSuiPrice = () =>
  useQuery<number>({
    queryKey: [useSuiPrice.name],
    queryFn: async () => {
      const data = await fetchCoinPrices([SUI_TYPE_ARG]);
      return data[0]?.price ?? 0;
    },
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
    staleTime: 5_000,
  });
