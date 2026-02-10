import { SuiClient } from '@mysten/sui/client';
import { useMemo } from 'react';
import { useReadLocalStorage } from 'usehooks-ts';

import { RPC, RPC_MAP, RPC_STORAGE_KEY } from '@/constants';

const useSuiClient = () => {
  const localRPC = useReadLocalStorage<RPC>(RPC_STORAGE_KEY) ?? RPC.Shinami;

  return useMemo(() => new SuiClient({ url: RPC_MAP[localRPC] }), [localRPC]);
};

export default useSuiClient;
