import { SuiClient } from '@mysten/sui/client';

const DEFAULT_RPC_URL = 'https://fullnode.mainnet.sui.io:443';

let cachedClient: SuiClient | null = null;
let cachedRpcUrl: string | null = null;

export const getSuiClient = (rpcUrl?: string): SuiClient => {
  const url = rpcUrl || DEFAULT_RPC_URL;

  if (cachedClient && cachedRpcUrl === url) {
    return cachedClient;
  }

  cachedClient = new SuiClient({ url });
  cachedRpcUrl = url;

  return cachedClient;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSuiClientForSdk = (rpcUrl?: string): any => {
  return getSuiClient(rpcUrl);
};
