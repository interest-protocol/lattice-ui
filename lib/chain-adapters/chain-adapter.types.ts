import type { ChainKey } from '@/constants/chains';

export interface DepositParams {
  userId: string;
  recipient: string;
  amount: string;
}

export interface DepositResult {
  txId: string;
}

export interface ChainAdapter {
  chainKey: ChainKey;
  encodeAddress(address: string): Uint8Array;
  encodeNativeToken(): Uint8Array;
  deposit(params: DepositParams): Promise<DepositResult>;
  confirmTransaction(txId: string): Promise<void>;
  getBalanceForPolling(balances: Record<string, bigint>): bigint | undefined;
  refetchBalance(): Promise<Record<string, bigint> | undefined>;
}
