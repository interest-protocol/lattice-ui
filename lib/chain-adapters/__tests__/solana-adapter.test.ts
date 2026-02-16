import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/wallet/client', () => ({
  sendSolana: vi.fn(),
}));

vi.mock('@/lib/solana/confirm-transaction', () => ({
  confirmSolanaTransaction: vi.fn(),
}));

vi.mock('@/constants/coins', () => ({
  NATIVE_SOL_MINT: 'So11111111111111111111111111111111111111112',
}));

const { sendSolana } = await import('@/lib/wallet/client');
const { confirmSolanaTransaction } = await import(
  '@/lib/solana/confirm-transaction'
);
const mockSendSolana = vi.mocked(sendSolana);
const mockConfirmTx = vi.mocked(confirmSolanaTransaction);

const { createSolanaAdapter } = await import('../solana-adapter');

describe('createSolanaAdapter', () => {
  const mockRpc = {} as never;
  const mockMutateBalances = vi.fn().mockResolvedValue({ sol: 1000n });

  const adapter = createSolanaAdapter(mockRpc, mockMutateBalances);

  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('has chainKey "solana"', () => {
    expect(adapter.chainKey).toBe('solana');
  });

  describe('encodeAddress', () => {
    it('encodes a Solana base58 address to 32 bytes', () => {
      // A known Solana address (system program)
      const address = '11111111111111111111111111111111';
      const bytes = adapter.encodeAddress(address);
      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBe(32);
    });
  });

  describe('encodeNativeToken', () => {
    it('encodes the native SOL mint address to 32 bytes', () => {
      const bytes = adapter.encodeNativeToken();
      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBe(32);
    });
  });

  describe('deposit', () => {
    it('calls sendSolana and returns signature as txId', async () => {
      mockSendSolana.mockResolvedValue({ signature: 'sol-sig-1' });

      const result = await adapter.deposit({
        userId: 'user-1',
        recipient: 'recipient-address',
        amount: '500000000',
      });

      expect(result).toEqual({ txId: 'sol-sig-1' });
      expect(mockSendSolana).toHaveBeenCalledWith({
        userId: 'user-1',
        recipient: 'recipient-address',
        amount: '500000000',
      });
    });
  });

  describe('confirmTransaction', () => {
    it('delegates to confirmSolanaTransaction', async () => {
      mockConfirmTx.mockResolvedValue(undefined);

      await adapter.confirmTransaction('sol-sig-1');

      expect(mockConfirmTx).toHaveBeenCalledWith(mockRpc, 'sol-sig-1');
    });
  });

  describe('getBalanceForPolling', () => {
    it('returns the sol balance from the balances record', () => {
      const balances = { sui: 500n, sol: 300n };
      expect(adapter.getBalanceForPolling(balances)).toBe(300n);
    });

    it('returns undefined when sol balance is missing', () => {
      const balances = { sui: 500n } as Record<string, bigint>;
      expect(adapter.getBalanceForPolling(balances)).toBeUndefined();
    });
  });

  describe('refetchBalance', () => {
    it('delegates to mutateBalances', async () => {
      mockMutateBalances.mockResolvedValue({ sol: 2000n });

      const result = await adapter.refetchBalance();

      expect(result).toEqual({ sol: 2000n });
      expect(mockMutateBalances).toHaveBeenCalled();
    });
  });
});
