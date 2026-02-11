import { create } from 'zustand';

import { REGISTRATION_CACHE_KEY } from '@/constants/storage-keys';
import { ApiRequestError } from '@/lib/api/client';
import {
  type CheckRegistrationResult,
  checkRegistration as checkRegistrationApi,
  createSolanaWallet,
  createSuiWallet,
  linkSolanaWallet,
} from '@/lib/wallet/client';

// --- Types ---

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
  userId: string | null;
  _isProcessing: boolean;
  _retryCount: number;

  checkRegistration: (userId: string) => void;
  registerWallets: () => void;
  startLinking: () => void;
  retry: () => void;
  reset: () => void;
  cleanup: () => void;
}

// --- Constants ---

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [2000, 5000, 10000];

// --- localStorage cache helpers ---

type CacheRecord = Record<string, boolean>;

const readCache = (): CacheRecord => {
  try {
    const raw = localStorage.getItem(REGISTRATION_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writeCache = (userId: string) => {
  try {
    const prev = readCache();
    localStorage.setItem(
      REGISTRATION_CACHE_KEY,
      JSON.stringify({ ...prev, [userId]: true })
    );
  } catch {
    // Non-critical — cache write failure is acceptable
  }
};

export const isUserCached = (userId: string): boolean =>
  readCache()[userId] ?? false;

// --- Timer management ---

let retryTimer: ReturnType<typeof setTimeout> | undefined;

const clearRetryTimer = () => {
  if (retryTimer !== undefined) {
    clearTimeout(retryTimer);
    retryTimer = undefined;
  }
};

// --- Async business logic ---

const doCheckRegistration = async (userId: string) => {
  const state = useOnboarding.getState();
  if (state._isProcessing) return;

  useOnboarding.setState({ _isProcessing: true, userId, error: null });

  // Fast-path: if localStorage cache says linked, verify on-chain
  // If cache says not linked, still check on-chain (source of truth)
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
      // Cache was stale — fall through to normal check logic
      handleCheckResult(result, userId);
      return;
    } catch {
      // API failed but cache says linked — trust cache
      useOnboarding.setState({ step: 'complete', _isProcessing: false });
      return;
    }
  }

  useOnboarding.setState({ step: 'checking' });

  try {
    const result = await checkRegistrationApi();
    handleCheckResult(result, userId);
  } catch {
    // On API failure, assume not registered and start from scratch
    useOnboarding.setState({
      step: 'creating-wallets',
      _isProcessing: false,
    });
    doRegisterWallets(0);
  }
};

const handleCheckResult = (result: CheckRegistrationResult, userId: string) => {
  if (result.registered) {
    writeCache(userId);
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

  useOnboarding.setState({
    step: 'creating-wallets',
    _isProcessing: false,
  });

  // Automatically trigger wallet creation
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
    const [suiResult, solanaResult] = await Promise.all([
      createSuiWallet(userId),
      createSolanaWallet(userId),
    ]);

    useOnboarding.setState({
      step: 'funding',
      suiAddress: suiResult.address,
      solanaAddress: solanaResult.address,
      _isProcessing: false,
    });
  } catch {
    if (retryCount < MAX_RETRY_ATTEMPTS) {
      useOnboarding.setState({ _isProcessing: false });
      retryTimer = setTimeout(
        () => doRegisterWallets(retryCount + 1),
        RETRY_DELAYS_MS[retryCount]
      );
      return;
    }
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
      writeCache(userId);
      useOnboarding.setState({
        step: 'complete',
        suiAddress: result.suiAddress ?? existingSui,
        solanaAddress: result.solanaAddress ?? existingSol,
        _isProcessing: false,
      });
      return;
    }

    writeCache(userId);
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

    if (retryCount < MAX_RETRY_ATTEMPTS) {
      useOnboarding.setState({ _isProcessing: false });
      retryTimer = setTimeout(
        () => doStartLinking(retryCount + 1),
        RETRY_DELAYS_MS[retryCount]
      );
      return;
    }
    useOnboarding.setState({
      error: 'Wallet linking failed. Please try again.',
      _isProcessing: false,
    });
  }
};

// --- Store ---

const initialState = {
  step: 'checking' as OnboardingStep,
  error: null as string | null,
  suiAddress: null as string | null,
  solanaAddress: null as string | null,
  userId: null as string | null,
  _isProcessing: false,
  _retryCount: 0,
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
