import { SUI_TYPE_ARG } from '@mysten/sui/utils';
import { useQuery } from '@tanstack/react-query';

import { SOL_TYPE } from '@/constants/coins';
import { fetchCoinPrices } from '@/lib/external/client';
import { normalizeSuiCoinType } from '@/utils/sui';

interface TokenPrices {
  [SUI_TYPE_ARG]: number | undefined;
  [SOL_TYPE]: number | undefined;
}

const useTokenPrices = () => {
  const { data, isLoading, error } = useQuery<TokenPrices>({
    queryKey: [useTokenPrices.name],
    queryFn: async () => {
      const quotes = await fetchCoinPrices([SUI_TYPE_ARG, SOL_TYPE]);
      const byNormalized: Record<string, number> = Object.fromEntries(
        quotes.map((q) => [q.coin, q.price])
      );

      return {
        [SUI_TYPE_ARG]: byNormalized.sui ?? undefined,
        [SOL_TYPE]: byNormalized.sol ?? undefined,
      } as TokenPrices;
    },
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
    staleTime: 5_000,
  });

  const getPrice = (tokenType: string): number | undefined =>
    data?.[normalizeSuiCoinType(tokenType) as keyof TokenPrices] ??
    data?.[tokenType as keyof TokenPrices];

  return { prices: data, getPrice, isLoading, error };
};

export default useTokenPrices;
