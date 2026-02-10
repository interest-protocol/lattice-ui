import { SuiClient } from '@mysten/sui/client';

import { SUI_RPC_URL } from '@/lib/config';

let cachedClient: SuiClient | null = null;
let cachedRpcUrl: string | null = null;

export const getSuiClient = (rpcUrl?: string): SuiClient => {
  const url = rpcUrl || SUI_RPC_URL;

  if (cachedClient && cachedRpcUrl === url) {
    return cachedClient;
  }

  cachedClient = new SuiClient({ url });
  cachedRpcUrl = url;

  return cachedClient;
};
