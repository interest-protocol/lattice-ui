import { Enclave, MAINNET_PACKAGE_ID } from '@interest-protocol/enclave-sdk';
import { SuiClient } from '@mysten/sui/client';

import { SUI_RPC_URL } from '@/lib/config';

export interface EnclaveClients {
  suiClient: SuiClient;
  enclave: Enclave;
}

export const createEnclaveSdk = (
  enclaveCapId: string,
  witnessType: string
): EnclaveClients => {
  const suiClient = new SuiClient({ url: SUI_RPC_URL });
  const enclave = new Enclave({
    suiClient,
    packageId: MAINNET_PACKAGE_ID,
    enclaveCapId,
    witnessType,
  });
  return { suiClient, enclave };
};

export { Enclave } from '@interest-protocol/enclave-sdk';
