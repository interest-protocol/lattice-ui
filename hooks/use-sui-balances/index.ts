import BigNumber from 'bignumber.js';
import useSWR from 'swr';

import { WSOL_SUI_TYPE } from '@/constants';
import useSuiClient from '@/hooks/use-sui-client';

const REFRESH_INTERVAL = 30_000;

const useSuiBalances = (address: string | null) => {
  const suiClient = useSuiClient();

  const { data, isLoading, mutate } = useSWR(
    address ? [useSuiBalances.name, address] : null,
    async () => {
      const [suiBalance, wsolBalance] = await Promise.all([
        suiClient.getBalance({ owner: address! }),
        suiClient.getBalance({ owner: address!, coinType: WSOL_SUI_TYPE }),
      ]);

      return {
        sui: new BigNumber(suiBalance.totalBalance),
        wsol: new BigNumber(wsolBalance.totalBalance),
      };
    },
    { refreshInterval: REFRESH_INTERVAL }
  );

  return {
    balances: data ?? { sui: new BigNumber(0), wsol: new BigNumber(0) },
    isLoading,
    mutate,
  };
};

export default useSuiBalances;
