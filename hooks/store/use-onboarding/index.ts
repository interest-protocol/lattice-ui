import { create } from 'zustand';

import {
  PARTIAL_WALLETS_KEY,
  REGISTRATION_CACHE_KEY,
} from '@/constants/storage-keys';
import { ApiRequestError } from '@/lib/api/client';
import {
  type CheckRegistrationResult,
  checkRegistration as checkRegistrationApi,
  createSolanaWallet,
  createSuiWallet,
  linkSolanaWallet,
} from '@/lib/wallet/client';

export type OnboardingStep =
  | 'checking'
  | 'creating-wallets'
  | 'funding'
  | 'linking'
  | 'confirming'
  | 'complete';

interface OnboardingState {
  step: OnboardingStep;
  error: string | null;
  suiAddress: string | null;
  solanaAddress: string | null;
  nonceAddress: string | null;
  userId: string | null;
  _isProcessing: boolean;
  _retryCount: number;
  _retryTimerId: ReturnType<typeof setTimeout> | undefined;

  checkRegistration: (userId: string) => void;
  registerWallets: () => void;
  startLinking: () => void;
  retry: () => void;
  reset: () => void;
  cleanup: () => void;
}

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [2000, 5000, 10000];

const scheduleRetry = (
  retryCount: number,
  fn: (nextCount: number) => void
): boolean => {
  if (retryCount >= MAX_RETRY_ATTEMPTS) return false;
  useOnboarding.setState({ _isProcessing: false });
  const timerId = setTimeout(
    () => fn(retryCount + 1),
    RETRY_DELAYS_MS[retryCount]
  );
  useOnboarding.setState({ _retryTimerId: timerId });
  return true;
};

interface CachedUser {
  linked: boolean;
  suiAddress?: string;
  solanaAddress?: string;
}

type CacheRecord = Record<string, boolean | CachedUser>;

const readCache = (): CacheRecord => {
  try {
    const raw = localStorage.getItem(REGISTRATION_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const readCachedUser = (userId: string): CachedUser | null => {
  const entry = readCache()[userId];
  if (!entry) return null;
  if (typeof entry === 'boolean') return { linked: entry };
  return entry;
};

const writeCache = (
  userId: string,
  addresses?: { suiAddress?: string | null; solanaAddress?: string | null }
) => {
  try {
    const prev = readCache();
    localStorage.setItem(
      REGISTRATION_CACHE_KEY,
      JSON.stringify({
        ...prev,
        [userId]: {
          linked: true,
          suiAddress: addresses?.suiAddress ?? undefined,
          solanaAddress: addresses?.solanaAddress ?? undefined,
        },
      })
    );
  } catch {}
};

export const isUserCached = (userId: string): boolean => {
  const entry = readCache()[userId];
  if (!entry) return false;
  if (typeof entry === 'boolean') return entry;
  return entry.linked;
};

// ---------------------------------------------------------------------------
// Partial wallet persistence — survives page refresh so we never re-create
// a wallet that was already created but whose registration hasn't completed.
// ---------------------------------------------------------------------------

const readPartialWallets = (
  userId: string
): { suiAddress?: string; solanaAddress?: string } => {
  try {
    const raw = localStorage.getItem(PARTIAL_WALLETS_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw);
    return data[userId] ?? {};
  } catch {
    return {};
  }
};

const writePartialWallet = (
  userId: string,
  chain: 'sui' | 'solana',
  address: string
) => {
  try {
    const raw = localStorage.getItem(PARTIAL_WALLETS_KEY);
    const data = raw ? JSON.parse(raw) : {};
    data[userId] = { ...data[userId], [`${chain}Address`]: address };
    localStorage.setItem(PARTIAL_WALLETS_KEY, JSON.stringify(data));
  } catch {}
};

const clearPartialWallets = (userId: string) => {
  try {
    const raw = localStorage.getItem(PARTIAL_WALLETS_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    delete data[userId];
    localStorage.setItem(PARTIAL_WALLETS_KEY, JSON.stringify(data));
  } catch {}
};

const clearRetryTimer = () => {
  const { _retryTimerId } = useOnboarding.getState();
  if (_retryTimerId !== undefined) {
    clearTimeout(_retryTimerId);
    useOnboarding.setState({ _retryTimerId: undefined });
  }
};

const doCheckRegistration = async (userId: string) => {
  const state = useOnboarding.getState();
  if (state._isProcessing) return;

  if (state.step === 'complete' && state.userId === userId) return;

  useOnboarding.setState({ _isProcessing: true, userId, error: null });

  if (isUserCached(userId)) {
    try {
      const result = await checkRegistrationApi();
      if (result.registered) {
        useOnboarding.setState({
          step: 'complete',
          suiAddress: result.suiAddress,
          solanaAddress: result.solanaAddress,
          _isProcessing: false,
        });
        return;
      }
      handleCheckResult(result, userId);
      return;
    } catch {
      const cached = readCachedUser(userId);
      if (cached?.suiAddress && cached?.solanaAddress) {
        useOnboarding.setState({
          step: 'complete',
          suiAddress: cached.suiAddress,
          solanaAddress: cached.solanaAddress,
          _isProcessing: false,
        });
      } else {
        const timerId = setTimeout(
          () => doCheckRegistration(userId),
          RETRY_DELAYS_MS[0]
        );
        useOnboarding.setState({
          step: 'checking',
          error: 'Connection lost. Retrying...',
          _isProcessing: false,
          _retryTimerId: timerId,
        });
      }
      return;
    }
  }

  useOnboarding.setState({ step: 'checking' });

  try {
    const result = await checkRegistrationApi();
    handleCheckResult(result, userId);
  } catch {
    // Restore any partially-created wallet addresses from localStorage so
    // doRegisterWallets skips wallets that already exist.
    const partial = readPartialWallets(userId);
    useOnboarding.setState({
      step: 'creating-wallets',
      suiAddress: partial.suiAddress ?? null,
      solanaAddress: partial.solanaAddress ?? null,
      _isProcessing: false,
    });
    doRegisterWallets(0);
  }
};

const handleCheckResult = (result: CheckRegistrationResult, userId: string) => {
  if (result.registered) {
    clearPartialWallets(userId);
    writeCache(userId, {
      suiAddress: result.suiAddress,
      solanaAddress: result.solanaAddress,
    });
    useOnboarding.setState({
      step: 'complete',
      suiAddress: result.suiAddress,
      solanaAddress: result.solanaAddress,
      _isProcessing: false,
    });
    return;
  }

  if (result.hasWallets) {
    useOnboarding.setState({
      step: 'funding',
      suiAddress: result.suiAddress,
      solanaAddress: result.solanaAddress,
      _isProcessing: false,
    });
    return;
  }

  // Always propagate whatever addresses the server already knows about so
  // doRegisterWallets can skip re-creating them.
  useOnboarding.setState({
    step: 'creating-wallets',
    suiAddress: result.suiAddress,
    solanaAddress: result.solanaAddress,
    _isProcessing: false,
  });

  doRegisterWallets(0);
};

const doRegisterWallets = async (retryCount = 0) => {
  const { userId, _isProcessing } = useOnboarding.getState();
  if (!userId || _isProcessing) return;

  useOnboarding.setState({
    _isProcessing: true,
    step: 'creating-wallets',
    error: null,
    _retryCount: retryCount,
  });

  try {
    const { suiAddress: stateSui, solanaAddress: stateSol } =
      useOnboarding.getState();

    // Hydrate from localStorage — covers the case where Zustand state was
    // lost on refresh but a wallet was already created in a prior session.
    const partial = readPartialWallets(userId);
    const existingSui = stateSui ?? partial.suiAddress ?? null;
    const existingSol = stateSol ?? partial.solanaAddress ?? null;

    const [suiSettled, solanaSettled] = await Promise.allSettled([
      existingSui ? { address: existingSui } : createSuiWallet(userId),
      existingSol ? { address: existingSol } : createSolanaWallet(userId),
    ]);

    const suiAddr =
      suiSettled.status === 'fulfilled' ? suiSettled.value.address : null;
    const solAddr =
      solanaSettled.status === 'fulfilled' ? solanaSettled.value.address : null;

    // Persist to both Zustand state and localStorage so neither a retry
    // within this session nor a full page refresh will re-create wallets.
    const newSui = suiAddr ?? existingSui;
    const newSol = solAddr ?? existingSol;

    if (newSui || newSol) {
      useOnboarding.setState({
        suiAddress: newSui,
        solanaAddress: newSol,
      });
      if (suiAddr) writePartialWallet(userId, 'sui', suiAddr);
      if (solAddr) writePartialWallet(userId, 'solana', solAddr);
    }

    if (newSui && newSol) {
      useOnboarding.setState({
        step: 'funding',
        _isProcessing: false,
      });
      return;
    }

    // At least one wallet failed — retry
    if (scheduleRetry(retryCount, doRegisterWallets)) return;
    useOnboarding.setState({
      error: 'Wallet setup failed. Please try again.',
      _isProcessing: false,
    });
  } catch {
    if (scheduleRetry(retryCount, doRegisterWallets)) return;
    useOnboarding.setState({
      error: 'Wallet setup failed. Please try again.',
      _isProcessing: false,
    });
  }
};

const doStartLinking = async (retryCount = 0) => {
  const { userId, _isProcessing } = useOnboarding.getState();
  if (!userId || _isProcessing) return;

  useOnboarding.setState({
    _isProcessing: true,
    step: 'linking',
    error: null,
    _retryCount: retryCount,
  });

  try {
    const result = await linkSolanaWallet(userId);
    useOnboarding.setState({ step: 'confirming' });

    if (result.alreadyLinked) {
      const { suiAddress: existingSui, solanaAddress: existingSol } =
        useOnboarding.getState();
      const suiAddr = result.suiAddress ?? existingSui;
      const solAddr = result.solanaAddress ?? existingSol;
      clearPartialWallets(userId);
      writeCache(userId, { suiAddress: suiAddr, solanaAddress: solAddr });
      useOnboarding.setState({
        step: 'complete',
        suiAddress: suiAddr,
        solanaAddress: solAddr,
        _isProcessing: false,
      });
      return;
    }

    clearPartialWallets(userId);
    writeCache(userId, {
      suiAddress: result.suiAddress,
      solanaAddress: result.solanaAddress,
    });
    useOnboarding.setState({
      step: 'complete',
      suiAddress: result.suiAddress,
      solanaAddress: result.solanaAddress,
      _isProcessing: false,
    });
  } catch (error) {
    if (error instanceof ApiRequestError && error.code === 'INSUFFICIENT_GAS') {
      useOnboarding.setState({
        step: 'funding',
        _isProcessing: false,
      });
      return;
    }

    if (scheduleRetry(retryCount, doStartLinking)) return;
    useOnboarding.setState({
      error: 'Wallet linking failed. Please try again.',
      _isProcessing: false,
    });
  }
};

const initialState = {
  step: 'checking' as OnboardingStep,
  error: null as string | null,
  suiAddress: null as string | null,
  solanaAddress: null as string | null,
  nonceAddress: null as string | null,
  userId: null as string | null,
  _isProcessing: false,
  _retryCount: 0,
  _retryTimerId: undefined as ReturnType<typeof setTimeout> | undefined,
};

export const useOnboarding = create<OnboardingState>((set, get) => ({
  ...initialState,

  checkRegistration: (userId) => {
    doCheckRegistration(userId);
  },

  registerWallets: () => {
    clearRetryTimer();
    set({ _isProcessing: false });
    doRegisterWallets(0);
  },

  startLinking: () => {
    clearRetryTimer();
    set({ _isProcessing: false });
    doStartLinking(0);
  },

  retry: () => {
    clearRetryTimer();
    const { step, userId } = get();
    set({ _isProcessing: false });

    if (step === 'checking' && userId) {
      doCheckRegistration(userId);
    } else if (step === 'creating-wallets') {
      doRegisterWallets(0);
    } else {
      doStartLinking(0);
    }
  },

  reset: () => {
    clearRetryTimer();
    set(initialState);
  },

  cleanup: () => {
    clearRetryTimer();
  },
}));
