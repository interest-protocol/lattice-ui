import {
  MAINNET_PACKAGE_ID,
  XBRIDGE_CONFIG_SHARED_OBJECT_DATA,
  XBRIDGE_INBOUND_SHARED_OBJECT_DATA,
  DWALLET_COORDINATOR_SHARED_OBJECT_DATA,
  XBridgeInbound,
} from '@interest-protocol/xbridge-sdk';
import { SuiClient } from '@mysten/sui/client';
import type { Transaction as SuiTransaction } from '@mysten/sui/transactions';

const DEFAULT_RPC_URL = 'https://fullnode.mainnet.sui.io:443';

export const REGISTRY_SHARED_OBJECT_DATA = {
  objectId:
    '0xe785fd9e5e8797bec0e5dbace1c4be4c787681f97c9c56ca7444fcc8ba72a330',
  initialSharedVersion: '779879272',
} as const;

export const XCORE_SHARED_OBJECT_DATA = {
  objectId:
    '0x4ad90f6e1dff41d0ed8e2eefc5f00dce6c31ef7cc4c2c7a01a43beaf8ea02f67',
  initialSharedVersion: '595876492',
} as const;

export const ENCLAVE_OBJECT_ID =
  '0x6a3114a47361653001fdaf82c2bd8a2fe05e1f1a04f00ccc0761663827b1362f';

export interface XBridgeClients {
  suiClient: SuiClient;
  xbridge: XBridgeInbound;
}

export const createXBridgeClients = (rpcUrl?: string): XBridgeClients => {
  const suiClient = new SuiClient({ url: rpcUrl || DEFAULT_RPC_URL });

  // SDK expects an older SuiClient type; runtime behavior is compatible
  const xbridge = new XBridgeInbound({
    suiClient: suiClient as Parameters<typeof XBridgeInbound>[0]['suiClient'],
    packageId: MAINNET_PACKAGE_ID,
    xbridgeConfigSharedObjectData: XBRIDGE_CONFIG_SHARED_OBJECT_DATA,
    xbridgeInboundSharedObjectData: XBRIDGE_INBOUND_SHARED_OBJECT_DATA,
    xcoreSharedObjectData: XCORE_SHARED_OBJECT_DATA,
    registrySharedObjectData: REGISTRY_SHARED_OBJECT_DATA,
    dwalletCoordinatorSharedObjectData: DWALLET_COORDINATOR_SHARED_OBJECT_DATA,
  });

  return { suiClient, xbridge };
};

type SdkTransaction = Parameters<XBridgeInbound['shareMintRequest']>[0]['tx'];

export const toSdkTransaction = (tx: SuiTransaction): SdkTransaction => {
  return tx as unknown as SdkTransaction;
};

type SdkClient = Parameters<SuiTransaction['build']>[0]['client'];

export const toSdkClient = (client: SuiClient): SdkClient => {
  return client as unknown as SdkClient;
};
