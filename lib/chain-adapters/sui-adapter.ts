import { SuiAddress } from '@interest-protocol/registry-sdk';
import type { SuiClient } from '@mysten/sui/client';
import { SUI_TYPE_ARG } from '@mysten/sui/utils';
import type BigNumber from 'bignumber.js';

import { sendSui } from '@/lib/wallet/client';

import type { ChainAdapter, DepositParams } from './chain-adapter.types';

export const createSuiAdapter = (
  suiClient: SuiClient,
  mutateBalances: () => Promise<Record<string, BigNumber> | undefined>
): ChainAdapter => ({
  chainKey: 'sui',

  encodeAddress(address: string): Uint8Array {
    return SuiAddress.fromHex(address).toBytes();
  },

  encodeNativeToken(): Uint8Array {
    return new TextEncoder().encode(SUI_TYPE_ARG);
  },

  async deposit(params: DepositParams) {
    const result = await sendSui({
      userId: params.userId,
      recipient: params.recipient,
      amount: params.amount,
    });
    return { txId: result.digest };
  },

  async confirmTransaction(txId: string) {
    await suiClient.waitForTransaction({
      digest: txId,
      options: { showEffects: true },
    });
  },

  getBalanceForPolling(balances: Record<string, BigNumber>) {
    return balances.sui;
  },

  async refetchBalance() {
    return mutateBalances();
  },
});
