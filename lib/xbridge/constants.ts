import {
  MAINNET_PACKAGE_ID,
  XBRIDGE_CONFIG_SHARED_OBJECT_DATA,
  XBRIDGE_INBOUND_SHARED_OBJECT_DATA,
  DWALLET_COORDINATOR_SHARED_OBJECT_DATA,
  XBridgeInbound,
} from '@interest-protocol/xbridge-sdk';

import { getSuiClientForSdk } from './sui-client';

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

export const createXBridgeInbound = (rpcUrl?: string): XBridgeInbound => {
  return new XBridgeInbound({
    suiClient: getSuiClientForSdk(rpcUrl),
    packageId: MAINNET_PACKAGE_ID,
    xbridgeConfigSharedObjectData: XBRIDGE_CONFIG_SHARED_OBJECT_DATA,
    xbridgeInboundSharedObjectData: XBRIDGE_INBOUND_SHARED_OBJECT_DATA,
    xcoreSharedObjectData: XCORE_SHARED_OBJECT_DATA,
    registrySharedObjectData: REGISTRY_SHARED_OBJECT_DATA,
    dwalletCoordinatorSharedObjectData: DWALLET_COORDINATOR_SHARED_OBJECT_DATA,
  });
};
