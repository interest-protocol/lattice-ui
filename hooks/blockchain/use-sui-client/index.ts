import { SuiClient } from '@mysten/sui/client';
import { useReadLocalStorage } from 'usehooks-ts';

import { RPC, RPC_MAP, RPC_STORAGE_KEY } from '@/constants';

const clientCache = new Map<string, SuiClient>();

const useSuiClient = () => {
  const localRPC = useReadLocalStorage<RPC>(RPC_STORAGE_KEY) ?? RPC.Mysten;
  const url = RPC_MAP[localRPC];

  let client = clientCache.get(url);
  if (!client) {
    client = new SuiClient({ url });
    clientCache.set(url, client);
  }

  return client;
};

export default useSuiClient;
