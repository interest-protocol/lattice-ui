import BigNumber from 'bignumber.js';
import { useMemo } from 'react';
import useSWR from 'swr';

import { WSOL_SUI_TYPE } from '@/constants';
import useSuiClient from '@/hooks/use-sui-client';
import { balanceSwrConfig } from '@/lib/swr/config';

const DEFAULT_SUI_BALANCES = { sui: new BigNumber(0), wsol: new BigNumber(0) };

const useSuiBalances = (address: string | null) => {
  const suiClient = useSuiClient();

  const { data, isLoading, mutate } = useSWR(
    address ? [useSuiBalances.name, address] : null,
    async () => {
      if (!address) return { sui: new BigNumber(0), wsol: new BigNumber(0) };
      const [suiBalance, wsolBalance] = await Promise.all([
        suiClient.getBalance({ owner: address }),
        suiClient.getBalance({ owner: address, coinType: WSOL_SUI_TYPE }),
      ]);

      return {
        sui: new BigNumber(suiBalance.totalBalance),
        wsol: new BigNumber(wsolBalance.totalBalance),
      };
    },
    balanceSwrConfig
  );

  const balances = useMemo(() => data ?? DEFAULT_SUI_BALANCES, [data]);

  return {
    balances,
    isLoading,
    mutate,
  };
};

export default useSuiBalances;
