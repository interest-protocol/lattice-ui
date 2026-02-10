import {
  REGISTRY_SHARED_OBJECT_DATA,
  Registry,
} from '@interest-protocol/registry-sdk';
import { SuiClient } from '@mysten/sui/client';

import { SUI_RPC_URL } from '@/lib/config';

let cachedClient: {
  url: string;
  registry: Registry;
  suiClient: SuiClient;
} | null = null;

export interface RegistryClients {
  suiClient: SuiClient;
  registry: Registry;
}

export const createRegistrySdk = (rpcUrl?: string): RegistryClients => {
  const url = rpcUrl || SUI_RPC_URL;

  if (cachedClient && cachedClient.url === url) {
    return cachedClient;
  }

  const suiClient = new SuiClient({ url });
  const registry = new Registry({
    suiClient,
    registrySharedObjectData: REGISTRY_SHARED_OBJECT_DATA,
  });

  cachedClient = { url, registry, suiClient };
  return cachedClient;
};

export {
  Registry,
  SolanaPubkey,
  REGISTRY_SHARED_OBJECT_DATA,
} from '@interest-protocol/registry-sdk';
