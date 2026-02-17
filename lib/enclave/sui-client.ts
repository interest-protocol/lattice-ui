import { SuiClient } from '@mysten/sui/client';

import { ENCLAVE_URL } from '@/lib/config.server';

let cachedClient: SuiClient | null = null;
let cachedRpcUrl: string | null = null;

interface HealthCheckResponse {
  rpc_status: {
    sui: Record<string, boolean>;
  };
}

const fetchEnclaveRpcUrl = async (): Promise<string> => {
  const response = await fetch(`${ENCLAVE_URL}/health_check`, {
    signal: AbortSignal.timeout(5_000),
  });

  if (!response.ok) {
    throw new Error(`Enclave health_check failed: HTTP ${response.status}`);
  }

  const data: HealthCheckResponse = await response.json();
  const urls = Object.keys(data.rpc_status.sui);

  if (urls.length === 0) {
    throw new Error('No Sui RPC URL found in enclave health_check');
  }

  return urls[0];
};

export const getEnclaveSuiClient = async (): Promise<SuiClient> => {
  if (cachedClient && cachedRpcUrl) {
    return cachedClient;
  }

  const url = await fetchEnclaveRpcUrl();
  cachedClient = new SuiClient({ url });
  cachedRpcUrl = url;

  return cachedClient;
};
