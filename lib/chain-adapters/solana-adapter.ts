import { SolanaPubkey } from '@interest-protocol/registry-sdk';
import type { Connection } from '@solana/web3.js';
import type BigNumber from 'bignumber.js';

import { NATIVE_SOL_MINT } from '@/constants/coins';
import { confirmSolanaTransaction } from '@/lib/solana/confirm-transaction';
import { sendSolana } from '@/lib/wallet/client';

import type { ChainAdapter, DepositParams } from './chain-adapter.types';

export const createSolanaAdapter = (
  connection: Connection,
  mutateBalances: () => Promise<Record<string, BigNumber> | undefined>
): ChainAdapter => ({
  chainKey: 'solana',

  encodeAddress(address: string): Uint8Array {
    return SolanaPubkey.fromBs58(address).toBytes();
  },

  encodeNativeToken(): Uint8Array {
    return SolanaPubkey.fromBs58(NATIVE_SOL_MINT).toBytes();
  },

  async deposit(params: DepositParams) {
    const result = await sendSolana({
      userId: params.userId,
      recipient: params.recipient,
      amount: params.amount,
    });
    return { txId: result.signature };
  },

  async confirmTransaction(txId: string) {
    await confirmSolanaTransaction(connection, txId);
  },

  getBalanceForPolling(balances: Record<string, BigNumber>) {
    return balances.sol;
  },

  async refetchBalance() {
    return mutateBalances();
  },
});
