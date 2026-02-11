import { SuiClient } from '@mysten/sui/client';
import { useReadLocalStorage } from 'usehooks-ts';

import { RPC, RPC_MAP, RPC_STORAGE_KEY } from '@/constants';

const useSuiClient = () => {
  const localRPC = useReadLocalStorage<RPC>(RPC_STORAGE_KEY) ?? RPC.Shinami;

  return new SuiClient({ url: RPC_MAP[localRPC] });
};

export default useSuiClient;
