import { normalizeStructTag, SUI_TYPE_ARG } from '@mysten/sui/utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/wallet/client', () => ({
  sendSui: vi.fn(),
}));

const { sendSui } = await import('@/lib/wallet/client');
const mockSendSui = vi.mocked(sendSui);

const { createSuiAdapter } = await import('../sui-adapter');

describe('createSuiAdapter', () => {
  const mockSuiClient = {
    waitForTransaction: vi.fn().mockResolvedValue({}),
  };
  const mockMutateBalances = vi.fn().mockResolvedValue({ sui: 1000n });

  const adapter = createSuiAdapter(
    mockSuiClient as never,
    mockMutateBalances
  );

  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('has chainKey "sui"', () => {
    expect(adapter.chainKey).toBe('sui');
  });

  describe('encodeAddress', () => {
    it('encodes a Sui hex address to bytes', () => {
      const address =
        '0x0000000000000000000000000000000000000000000000000000000000000001';
      const bytes = adapter.encodeAddress(address);
      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBe(32);
      expect(bytes[31]).toBe(1);
    });
  });

  describe('encodeNativeToken', () => {
    it('encodes SUI_TYPE_ARG as UTF-8 bytes', () => {
      const bytes = adapter.encodeNativeToken();
      const decoded = new TextDecoder().decode(bytes);
      expect(decoded).toBe(normalizeStructTag(SUI_TYPE_ARG));
    });
  });

  describe('deposit', () => {
    it('calls sendSui and returns digest as txId', async () => {
      mockSendSui.mockResolvedValue({ digest: 'tx-digest-1' });

      const result = await adapter.deposit({
        userId: 'user-1',
        recipient: '0xrecipient',
        amount: '1000000000',
      });

      expect(result).toEqual({ txId: 'tx-digest-1' });
      expect(mockSendSui).toHaveBeenCalledWith({
        userId: 'user-1',
        recipient: '0xrecipient',
        amount: '1000000000',
      });
    });
  });

  describe('confirmTransaction', () => {
    it('calls suiClient.waitForTransaction with digest', async () => {
      await adapter.confirmTransaction('tx-digest-1');

      expect(mockSuiClient.waitForTransaction).toHaveBeenCalledWith({
        digest: 'tx-digest-1',
        options: { showEffects: true },
      });
    });
  });

  describe('getBalanceForPolling', () => {
    it('returns the sui balance from the balances record', () => {
      const balances = { sui: 500n, sol: 300n };
      expect(adapter.getBalanceForPolling(balances)).toBe(500n);
    });

    it('returns undefined when sui balance is missing', () => {
      const balances = { sol: 300n } as Record<string, bigint>;
      expect(adapter.getBalanceForPolling(balances)).toBeUndefined();
    });
  });

  describe('refetchBalance', () => {
    it('delegates to mutateBalances', async () => {
      mockMutateBalances.mockResolvedValue({ sui: 2000n });

      const result = await adapter.refetchBalance();

      expect(result).toEqual({ sui: 2000n });
      expect(mockMutateBalances).toHaveBeenCalled();
    });
  });
});
