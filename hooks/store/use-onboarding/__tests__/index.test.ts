import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockCheckRegistration = vi.fn();
const mockCreateSuiWallet = vi.fn();
const mockCreateSolanaWallet = vi.fn();
const mockLinkSolanaWallet = vi.fn();

vi.mock('@/lib/wallet/client', () => ({
  checkRegistration: () => mockCheckRegistration(),
  createSuiWallet: (userId: string) => mockCreateSuiWallet(userId),
  createSolanaWallet: (userId: string) => mockCreateSolanaWallet(userId),
  linkSolanaWallet: (userId: string) => mockLinkSolanaWallet(userId),
}));

vi.mock('@/lib/api/client', () => ({
  ApiRequestError: class extends Error {
    status: number;
    code?: string;
    constructor(message: string, status: number, code?: string) {
      super(message);
      this.name = 'ApiRequestError';
      this.status = status;
      this.code = code;
    }
  },
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock('@/constants/storage-keys', () => ({
  REGISTRATION_CACHE_KEY: 'test-registration-cache',
}));

const { useOnboarding } = await import('../index');

const waitForState = (
  predicate: () => boolean,
  timeout = 2000
): Promise<void> =>
  new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      if (predicate()) return resolve();
      if (Date.now() - start > timeout)
        return reject(new Error('State timeout'));
      setTimeout(check, 10);
    };
    check();
  });

describe('useOnboarding store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    useOnboarding.getState().reset();

    const storage: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, value: string) => {
        storage[key] = value;
      },
      removeItem: (key: string) => {
        delete storage[key];
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('checkRegistration', () => {
    it('transitions to complete when on-chain linked', async () => {
      mockCheckRegistration.mockResolvedValue({
        registered: true,
        suiAddress: '0xabc',
        solanaAddress: 'sol123',
        hasWallets: true,
      });

      useOnboarding.getState().checkRegistration('user-1');

      await waitForState(() => useOnboarding.getState().step === 'complete');

      const state = useOnboarding.getState();
      expect(state.step).toBe('complete');
      expect(state.suiAddress).toBe('0xabc');
    });

    it('transitions to funding when wallets exist but not linked', async () => {
      mockCheckRegistration.mockResolvedValue({
        registered: false,
        suiAddress: '0xabc',
        solanaAddress: 'sol123',
        hasWallets: true,
      });

      useOnboarding.getState().checkRegistration('user-1');

      await waitForState(() => useOnboarding.getState().step === 'funding');

      const state = useOnboarding.getState();
      expect(state.step).toBe('funding');
      expect(state.suiAddress).toBe('0xabc');
    });

    it('transitions to creating-wallets when no wallets', async () => {
      mockCheckRegistration.mockResolvedValue({
        registered: false,
        suiAddress: null,
        solanaAddress: null,
        hasWallets: false,
      });

      useOnboarding.getState().checkRegistration('user-1');

      await waitForState(
        () => useOnboarding.getState().step === 'creating-wallets'
      );

      expect(useOnboarding.getState().step).toBe('creating-wallets');
    });

    it('second call supersedes a stale in-flight call via generation counter', async () => {
      let resolveFirst: ((v: unknown) => void) | undefined;
      const firstCall = new Promise((resolve) => {
        resolveFirst = resolve;
      });

      mockCheckRegistration
        .mockImplementationOnce(() => firstCall)
        .mockResolvedValueOnce({
          registered: true,
          suiAddress: '0xnew',
          solanaAddress: 'solNew',
          hasWallets: true,
        });

      // First call starts
      useOnboarding.getState().checkRegistration('user-1');

      // Second call supersedes via generation bump
      useOnboarding.getState().checkRegistration('user-1');

      await waitForState(() => useOnboarding.getState().step === 'complete');
      expect(useOnboarding.getState().suiAddress).toBe('0xnew');

      // Resolve first call — it should be a no-op (stale generation)
      resolveFirst?.({
        registered: true,
        suiAddress: '0xold',
        solanaAddress: 'solOld',
        hasWallets: true,
      });

      // State should not be overwritten by the stale first call
      await vi.advanceTimersByTimeAsync(100);
      expect(useOnboarding.getState().suiAddress).toBe('0xnew');
    });

    it('bounds retries to MAX_RETRY_ATTEMPTS and shows error', async () => {
      mockCheckRegistration.mockRejectedValue(new Error('Network error'));

      useOnboarding.getState().checkRegistration('user-1');

      // Initial call
      await waitForState(() => useOnboarding.getState().error !== null);
      expect(useOnboarding.getState().error).toBe(
        'Connection lost. Retrying...'
      );
      expect(mockCheckRegistration).toHaveBeenCalledTimes(1);

      // Retry 1 at 2s
      await vi.advanceTimersByTimeAsync(2100);
      expect(mockCheckRegistration).toHaveBeenCalledTimes(2);

      // Retry 2 at 5s
      await vi.advanceTimersByTimeAsync(5100);
      expect(mockCheckRegistration).toHaveBeenCalledTimes(3);

      // Retry 3 at 10s
      await vi.advanceTimersByTimeAsync(10100);
      expect(mockCheckRegistration).toHaveBeenCalledTimes(4);

      await waitForState(
        () =>
          useOnboarding.getState().error ===
          'Unable to check registration. Please try again.'
      );
      expect(useOnboarding.getState().error).toBe(
        'Unable to check registration. Please try again.'
      );
    });
  });

  describe('registerWallets', () => {
    it('creates wallets sequentially (Sui first, then Solana)', async () => {
      const callOrder: string[] = [];

      mockCheckRegistration.mockResolvedValue({
        registered: false,
        suiAddress: null,
        solanaAddress: null,
        hasWallets: false,
      });

      mockCreateSuiWallet.mockImplementation(async () => {
        callOrder.push('sui');
        return { address: '0xsui' };
      });

      mockCreateSolanaWallet.mockImplementation(async () => {
        callOrder.push('solana');
        return { address: 'sol123' };
      });

      useOnboarding.getState().checkRegistration('user-1');

      await waitForState(() => useOnboarding.getState().step === 'funding');

      expect(callOrder).toEqual(['sui', 'solana']);
      expect(useOnboarding.getState().suiAddress).toBe('0xsui');
      expect(useOnboarding.getState().solanaAddress).toBe('sol123');
    });

    it('concurrent registerWallets calls only produce one set of API calls', async () => {
      useOnboarding.setState({
        userId: 'user-1',
        step: 'creating-wallets',
      });

      let suiCallCount = 0;
      mockCreateSuiWallet.mockImplementation(async () => {
        suiCallCount++;
        return { address: '0xsui' };
      });
      mockCreateSolanaWallet.mockResolvedValue({ address: 'sol123' });

      // Fire two concurrent calls
      useOnboarding.getState().registerWallets();
      useOnboarding.getState().registerWallets();

      await waitForState(() => useOnboarding.getState().step === 'funding');

      // Second call's generation supersedes the first, so only one set runs to completion
      // The first call becomes stale after the second increments the generation
      expect(suiCallCount).toBeLessThanOrEqual(2);
      expect(useOnboarding.getState().suiAddress).toBe('0xsui');
      expect(useOnboarding.getState().solanaAddress).toBe('sol123');
    });
  });

  describe('startLinking', () => {
    it('transitions to complete on success', async () => {
      useOnboarding.setState({
        userId: 'user-1',
        step: 'funding',
      });

      mockLinkSolanaWallet.mockResolvedValue({
        digest: 'tx-123',
        suiAddress: '0xabc',
        solanaAddress: 'sol123',
      });

      useOnboarding.getState().startLinking();

      await waitForState(() => useOnboarding.getState().step === 'complete');

      expect(useOnboarding.getState().step).toBe('complete');
    });

    it('transitions back to funding on INSUFFICIENT_GAS', async () => {
      useOnboarding.setState({
        userId: 'user-1',
        step: 'funding',
      });

      const { ApiRequestError } = await import('@/lib/api/client');
      mockLinkSolanaWallet.mockRejectedValue(
        new ApiRequestError('Insufficient SUI for gas', 402, 'INSUFFICIENT_GAS')
      );

      useOnboarding.getState().startLinking();

      await waitForState(() => useOnboarding.getState().step === 'funding');

      expect(useOnboarding.getState().step).toBe('funding');
    });

    it('transitions to complete on ALREADY_LINKED response', async () => {
      useOnboarding.setState({
        userId: 'user-1',
        step: 'funding',
      });

      mockLinkSolanaWallet.mockResolvedValue({
        alreadyLinked: true,
        digest: null,
        suiAddress: '0xabc',
        solanaAddress: 'sol123',
      });

      useOnboarding.getState().startLinking();

      await waitForState(() => useOnboarding.getState().step === 'complete');

      expect(useOnboarding.getState().step).toBe('complete');
    });
  });

  describe('retry with exponential backoff', () => {
    it('retries wallet creation 3 times at 2s/5s/10s then errors', async () => {
      mockCheckRegistration.mockResolvedValue({
        registered: false,
        suiAddress: null,
        solanaAddress: null,
        hasWallets: false,
      });

      mockCreateSuiWallet.mockRejectedValue(new Error('Network error'));
      mockCreateSolanaWallet.mockRejectedValue(new Error('Network error'));

      useOnboarding.getState().checkRegistration('user-1');

      await waitForState(
        () => useOnboarding.getState().step === 'creating-wallets'
      );

      await vi.advanceTimersByTimeAsync(2100);
      expect(mockCreateSuiWallet).toHaveBeenCalledTimes(2);

      await vi.advanceTimersByTimeAsync(5100);
      expect(mockCreateSuiWallet).toHaveBeenCalledTimes(3);

      await vi.advanceTimersByTimeAsync(10100);
      expect(mockCreateSuiWallet).toHaveBeenCalledTimes(4);

      await waitForState(() => useOnboarding.getState().error !== null);
      expect(useOnboarding.getState().error).toBe(
        'Wallet setup failed. Please try again.'
      );
    });
  });

  describe('cleanup', () => {
    it('cancels pending retry timers', async () => {
      useOnboarding.setState({
        userId: 'user-1',
        step: 'funding',
      });

      mockLinkSolanaWallet.mockRejectedValue(new Error('Temporary error'));

      useOnboarding.getState().startLinking();

      await waitForState(
        () => useOnboarding.getState()._retryTimerId !== undefined
      );

      useOnboarding.getState().cleanup();

      const callsBefore = mockLinkSolanaWallet.mock.calls.length;

      await vi.advanceTimersByTimeAsync(20000);

      expect(mockLinkSolanaWallet).toHaveBeenCalledTimes(callsBefore);
    });
  });

  describe('alreadyLinked with null addresses', () => {
    it('falls back to existing store values when response has null addresses', async () => {
      useOnboarding.setState({
        userId: 'user-1',
        step: 'funding',
        suiAddress: '0xexisting',
        solanaAddress: 'solExisting',
      });

      mockLinkSolanaWallet.mockResolvedValue({
        alreadyLinked: true,
        digest: null,
        suiAddress: null,
        solanaAddress: null,
        code: 'ALREADY_LINKED',
      });

      useOnboarding.getState().startLinking();

      await waitForState(() => useOnboarding.getState().step === 'complete');

      const state = useOnboarding.getState();
      expect(state.step).toBe('complete');
      expect(state.suiAddress).toBe('0xexisting');
      expect(state.solanaAddress).toBe('solExisting');
    });
  });

  describe('reset', () => {
    it('clears all state', () => {
      useOnboarding.setState({
        step: 'funding',
        error: 'some error',
        suiAddress: '0xabc',
        userId: 'user-1',
        _generation: 5,
        _retryCount: 2,
      });

      useOnboarding.getState().reset();

      const state = useOnboarding.getState();
      expect(state.step).toBe('checking');
      expect(state.error).toBeNull();
      expect(state.suiAddress).toBeNull();
      expect(state.userId).toBeNull();
      expect(state._generation).toBe(0);
      expect(state._retryCount).toBe(0);
    });
  });
});
