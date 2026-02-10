import { SUI_TYPE_ARG } from '@mysten/sui/utils';
import { useQuery } from '@tanstack/react-query';

import { SOL_TYPE } from '@/constants/coins';
import { fetchCoinPrices } from '@/lib/external/client';

interface TokenPrices {
  [SUI_TYPE_ARG]: number;
  [SOL_TYPE]: number;
}

const useTokenPrices = () => {
  const { data, isLoading, error } = useQuery<TokenPrices>({
    queryKey: [useTokenPrices.name],
    queryFn: async () => {
      const quotes = await fetchCoinPrices([SUI_TYPE_ARG, SOL_TYPE]);
      const byNormalized: Record<string, number> = {};
      for (const q of quotes) byNormalized[q.coin] = q.price;

      return {
        [SUI_TYPE_ARG]: byNormalized.sui ?? 0,
        [SOL_TYPE]: byNormalized.sol ?? 0,
      } as TokenPrices;
    },
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
    staleTime: 5_000,
  });

  const getPrice = (tokenType: string): number =>
    data?.[tokenType as keyof TokenPrices] ?? 0;

  return { prices: data, getPrice, isLoading, error };
};

export default useTokenPrices;
