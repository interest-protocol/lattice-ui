import { SuiClient } from '@mysten/sui/client';
import { useReadLocalStorage } from 'usehooks-ts';

import { RPC, RPC_MAP, RPC_STORAGE_KEY } from '@/constants';

let cachedClient: { url: string; client: SuiClient } | null = null;

const useSuiClient = () => {
  const localRPC = useReadLocalStorage<RPC>(RPC_STORAGE_KEY) ?? RPC.Mysten;
  const url = RPC_MAP[localRPC];

  if (!cachedClient || cachedClient.url !== url) {
    cachedClient = { url, client: new SuiClient({ url }) };
  }

  return cachedClient.client;
};

export default useSuiClient;
