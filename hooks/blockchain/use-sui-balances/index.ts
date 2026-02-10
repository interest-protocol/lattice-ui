import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { WSOL_SUI_TYPE } from '@/constants';
import useSuiClient from '@/hooks/blockchain/use-sui-client';
import { CurrencyAmount, Token } from '@/lib/entities';

const DEFAULT_SUI_BALANCES = { sui: 0n, wsol: 0n };

const useSuiBalances = (address: string | null) => {
  const suiClient = useSuiClient();
  const queryClient = useQueryClient();

  const queryKey = useMemo(() => [useSuiBalances.name, address], [address]);

  const fetchBalances = useCallback(async () => {
    if (!address) return DEFAULT_SUI_BALANCES;
    const [suiBalance, wsolBalance] = await Promise.all([
      suiClient.getBalance({ owner: address }),
      suiClient.getBalance({ owner: address, coinType: WSOL_SUI_TYPE }),
    ]);

    return {
      sui: BigInt(suiBalance.totalBalance),
      wsol: BigInt(wsolBalance.totalBalance),
    };
  }, [suiClient, address]);

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: fetchBalances,
    enabled: !!address,
    refetchInterval: 30_000,
    refetchOnWindowFocus: false,
    staleTime: 5_000,
    structuralSharing: false,
  });

  const balances = useMemo(() => data ?? DEFAULT_SUI_BALANCES, [data]);

  const amounts = useMemo(
    () => ({
      sui: CurrencyAmount.fromRawAmount(Token.SUI, balances.sui),
    }),
    [balances.sui]
  );

  const mutate = useCallback(async () => {
    const result = await queryClient.fetchQuery({
      queryKey,
      queryFn: fetchBalances,
      staleTime: 0,
    });
    return result;
  }, [queryClient, queryKey, fetchBalances]);

  return {
    balances,
    amounts,
    isLoading,
    mutate,
  };
};

export default useSuiBalances;
