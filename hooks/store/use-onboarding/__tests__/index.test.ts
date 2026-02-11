import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// --- Mocks ---

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

// Import after mocks
const { useOnboarding } = await import('../index');

// Helper to wait for async state updates
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

    // Mock localStorage
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

    it('is a no-op when already processing', async () => {
      mockCheckRegistration.mockImplementation(
        () => new Promise(() => {}) // never resolves
      );

      useOnboarding.getState().checkRegistration('user-1');

      // Wait for _isProcessing to be true
      await waitForState(() => useOnboarding.getState()._isProcessing);

      // Second call should be a no-op
      useOnboarding.getState().checkRegistration('user-1');

      expect(mockCheckRegistration).toHaveBeenCalledTimes(1);
    });
  });

  describe('startLinking', () => {
    it('transitions to complete on success', async () => {
      useOnboarding.setState({
        userId: 'user-1',
        step: 'funding',
        _isProcessing: false,
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
        _isProcessing: false,
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
        _isProcessing: false,
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

  describe('reset', () => {
    it('clears all state', () => {
      useOnboarding.setState({
        step: 'funding',
        error: 'some error',
        suiAddress: '0xabc',
        userId: 'user-1',
        _isProcessing: true,
        _retryCount: 2,
      });

      useOnboarding.getState().reset();

      const state = useOnboarding.getState();
      expect(state.step).toBe('checking');
      expect(state.error).toBeNull();
      expect(state.suiAddress).toBeNull();
      expect(state.userId).toBeNull();
      expect(state._isProcessing).toBe(false);
      expect(state._retryCount).toBe(0);
    });
  });
});
