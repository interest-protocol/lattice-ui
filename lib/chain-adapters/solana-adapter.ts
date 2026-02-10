import { SolanaPubkey } from '@interest-protocol/registry-sdk';
import type { Signature } from '@solana/kit';

import { NATIVE_SOL_MINT } from '@/constants/coins';
import { confirmSolanaTransaction } from '@/lib/solana/confirm-transaction';
import type { SolanaRpc } from '@/lib/solana/server';
import { sendSolana } from '@/lib/wallet/client';

import type { ChainAdapter, DepositParams } from './chain-adapter.types';

export const createSolanaAdapter = (
  rpc: SolanaRpc,
  mutateBalances: () => Promise<Record<string, bigint> | undefined>
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
    await confirmSolanaTransaction(rpc, txId as Signature);
  },

  getBalanceForPolling(balances: Record<string, bigint>) {
    return balances.sol;
  },

  async refetchBalance() {
    return mutateBalances();
  },
});
