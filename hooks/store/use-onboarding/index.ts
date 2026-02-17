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
  _generation: number;
  _retryCount: number;
  _retryTimerId: ReturnType<typeof setTimeout> | undefined;
  _completedViaOnboarding: boolean;

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

const clearRetryTimer = () => {
  const { _retryTimerId } = useOnboarding.getState();
  if (_retryTimerId !== undefined) {
    clearTimeout(_retryTimerId);
    useOnboarding.setState({ _retryTimerId: undefined });
  }
};

const nextGeneration = (): number => {
  const next = useOnboarding.getState()._generation + 1;
  useOnboarding.setState({ _generation: next });
  return next;
};

const isStale = (gen: number): boolean =>
  gen !== useOnboarding.getState()._generation;

const doCheckRegistration = async (userId: string, retryCount = 0) => {
  const gen = nextGeneration();

  const state = useOnboarding.getState();
  if (state.step === 'complete' && state.userId === userId) return;

  useOnboarding.setState({ userId, error: null });

  if (isUserCached(userId)) {
    const cached = readCachedUser(userId);

    // Optimistic: immediately unblock the gate with cached addresses
    if (cached?.suiAddress && cached?.solanaAddress) {
      useOnboarding.setState({
        step: 'complete',
        suiAddress: cached.suiAddress,
        solanaAddress: cached.solanaAddress,
      });
    }

    try {
      const result = await checkRegistrationApi();
      if (isStale(gen)) return;
      if (result.registered) {
        useOnboarding.setState({
          step: 'complete',
          suiAddress: result.suiAddress,
          solanaAddress: result.solanaAddress,
        });
        return;
      }
      // Cache was stale — need onboarding
      handleCheckResult(result, userId, gen);
    } catch {
      if (isStale(gen)) return;
      // If we already set complete from cache, that's fine — keep using it
      if (cached?.suiAddress && cached?.solanaAddress) return;

      if (
        !scheduleRetry(retryCount, (n) => doCheckRegistration(userId, n))
      ) {
        useOnboarding.setState({
          step: 'checking',
          error: 'Unable to check registration. Please try again.',
        });
      } else {
        useOnboarding.setState({
          step: 'checking',
          error: 'Connection lost. Retrying...',
        });
      }
    }
    return;
  }

  useOnboarding.setState({ step: 'checking' });

  try {
    const result = await checkRegistrationApi();
    if (isStale(gen)) return;
    handleCheckResult(result, userId, gen);
  } catch {
    if (isStale(gen)) return;
    if (!scheduleRetry(retryCount, (n) => doCheckRegistration(userId, n))) {
      useOnboarding.setState({
        step: 'checking',
        error: 'Unable to check registration. Please try again.',
      });
    } else {
      useOnboarding.setState({
        step: 'checking',
        error: 'Connection lost. Retrying...',
      });
    }
  }
};

const handleCheckResult = (
  result: CheckRegistrationResult,
  userId: string,
  gen: number
) => {
  if (isStale(gen)) return;

  if (result.registered) {
    writeCache(userId, {
      suiAddress: result.suiAddress,
      solanaAddress: result.solanaAddress,
    });
    useOnboarding.setState({
      step: 'complete',
      suiAddress: result.suiAddress,
      solanaAddress: result.solanaAddress,
    });
    return;
  }

  if (result.hasWallets) {
    useOnboarding.setState({
      step: 'funding',
      suiAddress: result.suiAddress,
      solanaAddress: result.solanaAddress,
    });
    return;
  }

  // Always propagate whatever addresses the server already knows about so
  // doRegisterWallets can skip re-creating them.
  useOnboarding.setState({
    step: 'creating-wallets',
    suiAddress: result.suiAddress,
    solanaAddress: result.solanaAddress,
  });

  doRegisterWallets(0);
};

const doRegisterWallets = async (retryCount = 0) => {
  const { userId } = useOnboarding.getState();
  if (!userId) return;

  const gen = nextGeneration();

  useOnboarding.setState({
    step: 'creating-wallets',
    error: null,
    _retryCount: retryCount,
  });

  try {
    const { suiAddress: stateSui, solanaAddress: stateSol } =
      useOnboarding.getState();

    // Sequential creation: Sui first, then Solana (prevents metadata clobbering)
    let newSui = stateSui;
    if (!newSui) {
      const result = await createSuiWallet(userId);
      if (isStale(gen)) return;
      newSui = result.address;
      useOnboarding.setState({ suiAddress: newSui });
    }

    let newSol = stateSol;
    if (!newSol) {
      const result = await createSolanaWallet(userId);
      if (isStale(gen)) return;
      newSol = result.address;
      useOnboarding.setState({ solanaAddress: newSol });
    }

    if (isStale(gen)) return;

    if (newSui && newSol) {
      useOnboarding.setState({ step: 'funding' });
      return;
    }

    // At least one wallet failed — retry
    if (scheduleRetry(retryCount, doRegisterWallets)) return;
    useOnboarding.setState({
      error: 'Wallet setup failed. Please try again.',
    });
  } catch {
    if (isStale(gen)) return;
    if (scheduleRetry(retryCount, doRegisterWallets)) return;
    useOnboarding.setState({
      error: 'Wallet setup failed. Please try again.',
    });
  }
};

const doStartLinking = async (retryCount = 0) => {
  const { userId } = useOnboarding.getState();
  if (!userId) return;

  const gen = nextGeneration();

  useOnboarding.setState({
    step: 'linking',
    error: null,
    _retryCount: retryCount,
  });

  try {
    const result = await linkSolanaWallet(userId);
    if (isStale(gen)) return;

    useOnboarding.setState({ step: 'confirming' });

    if (result.alreadyLinked) {
      const { suiAddress: existingSui, solanaAddress: existingSol } =
        useOnboarding.getState();
      const suiAddr = result.suiAddress ?? existingSui;
      const solAddr = result.solanaAddress ?? existingSol;
      writeCache(userId, { suiAddress: suiAddr, solanaAddress: solAddr });
      useOnboarding.setState({
        step: 'complete',
        suiAddress: suiAddr,
        solanaAddress: solAddr,
        _completedViaOnboarding: true,
      });
      return;
    }

    writeCache(userId, {
      suiAddress: result.suiAddress,
      solanaAddress: result.solanaAddress,
    });
    useOnboarding.setState({
      step: 'complete',
      suiAddress: result.suiAddress,
      solanaAddress: result.solanaAddress,
      _completedViaOnboarding: true,
    });
  } catch (error) {
    if (isStale(gen)) return;

    if (error instanceof ApiRequestError && error.code === 'INSUFFICIENT_GAS') {
      useOnboarding.setState({
        step: 'funding',
        error: 'Not enough SUI for gas fees. Please add more and try again.',
      });
      return;
    }

    if (scheduleRetry(retryCount, doStartLinking)) return;
    useOnboarding.setState({
      error: 'Wallet linking failed. Please try again.',
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
  _generation: 0,
  _retryCount: 0,
  _retryTimerId: undefined as ReturnType<typeof setTimeout> | undefined,
  _completedViaOnboarding: false,
};

export const useOnboarding = create<OnboardingState>((set, get) => ({
  ...initialState,

  checkRegistration: (userId) => {
    clearRetryTimer();
    doCheckRegistration(userId);
  },

  registerWallets: () => {
    clearRetryTimer();
    doRegisterWallets(0);
  },

  startLinking: () => {
    clearRetryTimer();
    doStartLinking(0);
  },

  retry: () => {
    clearRetryTimer();
    const { step, userId } = get();

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
    set({ ...initialState, _generation: get()._generation + 1 });
  },

  cleanup: () => {
    clearRetryTimer();
    set({ _generation: get()._generation + 1 });
  },
}));
