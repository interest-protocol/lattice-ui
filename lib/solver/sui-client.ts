import { SuiClient } from '@mysten/sui/client';

import { getMetadata } from '@/lib/solver/server';

let cachedClient: SuiClient | null = null;
let cachedRpcUrl: string | null = null;

export const getSolverSuiClient = async (): Promise<SuiClient> => {
  if (cachedClient && cachedRpcUrl) return cachedClient;

  const metadata = await getMetadata();
  const suiChain = metadata.chains.find((c) => c.name === 'Sui');

  if (!suiChain) throw new Error('No Sui chain found in solver metadata');

  cachedClient = new SuiClient({ url: suiChain.rpcUrl });
  cachedRpcUrl = suiChain.rpcUrl;

  return cachedClient;
};
