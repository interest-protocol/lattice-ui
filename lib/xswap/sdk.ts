import { REGISTRY_SHARED_OBJECT_DATA } from '@interest-protocol/registry-sdk';
import { XCORE_SHARED_OBJECT_DATA } from '@interest-protocol/xcore-sdk';
import {
  DWALLET_COORDINATOR_SHARED_OBJECT_DATA,
  ENCLAVE_SHARED_OBJECT_DATA,
  MAINNET_PACKAGE_ID,
  XSWAP_SHARED_OBJECT_DATA,
  XSwap,
} from '@interest-protocol/xswap-sdk';
import { SuiClient } from '@mysten/sui/client';

import { SUI_RPC_URL } from '@/lib/config';

let cachedClient: { url: string; xswap: XSwap; suiClient: SuiClient } | null =
  null;

export interface XSwapClients {
  suiClient: SuiClient;
  xswap: XSwap;
}

export const createXSwapSdk = (): XSwapClients => {
  const url = SUI_RPC_URL;

  if (cachedClient && cachedClient.url === url) {
    return cachedClient;
  }

  const suiClient = new SuiClient({ url });
  const xswap = new XSwap({
    suiClient,
    packageId: MAINNET_PACKAGE_ID,
    xswapSharedObjectData: XSWAP_SHARED_OBJECT_DATA,
    xcoreSharedObjectData: XCORE_SHARED_OBJECT_DATA,
    registrySharedObjectData: REGISTRY_SHARED_OBJECT_DATA,
    dwalletCoordinatorSharedObjectData: DWALLET_COORDINATOR_SHARED_OBJECT_DATA,
    enclaveSharedObjectData: ENCLAVE_SHARED_OBJECT_DATA,
  });

  cachedClient = { url, xswap, suiClient };
  return cachedClient;
};

export { XSwap } from '@interest-protocol/xswap-sdk';
