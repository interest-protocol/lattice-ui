import { REGISTRY_SHARED_OBJECT_DATA } from '@interest-protocol/registry-sdk';
import {
  DWALLET_COORDINATOR_SHARED_OBJECT_DATA,
  MAINNET_PACKAGE_ID,
  XBRIDGE_CONFIG_SHARED_OBJECT_DATA,
  XBRIDGE_INBOUND_SHARED_OBJECT_DATA,
  XBridgeInbound,
} from '@interest-protocol/xbridge-sdk';
import { XCORE_SHARED_OBJECT_DATA } from '@interest-protocol/xcore-sdk';
import { SuiClient } from '@mysten/sui/client';

import { SUI_RPC_URL } from '@/lib/config';

let cachedClient: {
  url: string;
  xbridge: XBridgeInbound;
  suiClient: SuiClient;
} | null = null;

export interface XBridgeClients {
  suiClient: SuiClient;
  xbridge: XBridgeInbound;
}

export const createXBridgeSdk = (): XBridgeClients => {
  const url = SUI_RPC_URL;

  if (cachedClient && cachedClient.url === url) {
    return cachedClient;
  }

  const suiClient = new SuiClient({ url });
  const xbridge = new XBridgeInbound({
    suiClient,
    packageId: MAINNET_PACKAGE_ID,
    xbridgeConfigSharedObjectData: XBRIDGE_CONFIG_SHARED_OBJECT_DATA,
    xbridgeInboundSharedObjectData: XBRIDGE_INBOUND_SHARED_OBJECT_DATA,
    xcoreSharedObjectData: XCORE_SHARED_OBJECT_DATA,
    registrySharedObjectData: REGISTRY_SHARED_OBJECT_DATA,
    dwalletCoordinatorSharedObjectData: DWALLET_COORDINATOR_SHARED_OBJECT_DATA,
  });

  cachedClient = { url, xbridge, suiClient };
  return cachedClient;
};

export { XBridgeInbound } from '@interest-protocol/xbridge-sdk';
export { ENCLAVE_OBJECT_ID } from '@interest-protocol/xswap-sdk';
