import { create } from 'zustand';

import {
  WALLETS_LINKED_KEY,
  WALLETS_REGISTERED_KEY,
} from '@/constants/storage-keys';
import { ApiRequestError } from '@/lib/api/client';
import {
  createSolanaWallet,
  createSuiWallet,
  linkSolanaWallet,
} from '@/lib/wallet/client';

// --- Types ---

export type OnboardingStep =
  | 'creating-wallets'
  | 'funding'
  | 'linking'
  | 'complete';

export interface RegistrationParams {
  userId: string;
  hasSuiWallet: boolean;
  hasSolanaWallet: boolean;
  existingSuiAddress: string | null;
  refreshUser: () => Promise<unknown>;
}

interface OnboardingState {
  step: OnboardingStep;
  error: string | null;
  suiAddress: string | null;
  userId: string | null;

  registerWallets: (params: RegistrationParams) => void;
  linkWallets: () => void;
  retry: () => void;
  reset: () => void;
  cleanup: () => void;
}

// --- Module-level concurrency guards ---

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [2000, 5000, 10000];

let isRegistering = false;
let isLinking = false;
let retryTimer: ReturnType<typeof setTimeout> | undefined;
let registrationParams: RegistrationParams | null = null;

// --- localStorage helpers ---

type StorageRecord = Record<string, boolean>;

const readStorage = (key: string): StorageRecord => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writeStorage = (key: string, userId: string) => {
  const prev = readStorage(key);
  localStorage.setItem(key, JSON.stringify({ ...prev, [userId]: true }));
};

// --- Exported helpers ---

export const isUserRegistered = (userId: string): boolean =>
  readStorage(WALLETS_REGISTERED_KEY)[userId] ?? false;

export const isUserLinked = (userId: string): boolean =>
  readStorage(WALLETS_LINKED_KEY)[userId] ?? false;

// --- Async business logic ---

const registerWithRetry = async (retryCount = 0) => {
  const params = registrationParams;
  if (!params || isRegistering) return;

  isRegistering = true;
  useOnboarding.setState({ step: 'creating-wallets', error: null });

  try {
    const {
      userId,
      hasSuiWallet,
      hasSolanaWallet,
      existingSuiAddress,
      refreshUser,
    } = params;

    let createdSuiAddress: string | null = null;

    if (!hasSuiWallet || !hasSolanaWallet) {
      const [suiResult] = await Promise.all([
        !hasSuiWallet ? createSuiWallet(userId) : null,
        !hasSolanaWallet ? createSolanaWallet(userId) : null,
      ]);

      if (suiResult) {
        createdSuiAddress = suiResult.address;
        useOnboarding.setState({ suiAddress: suiResult.address });
      }

      try {
        await refreshUser();
      } catch {
        // Non-fatal — Privy will eventually sync.
      }
    }

    writeStorage(WALLETS_REGISTERED_KEY, userId);

    const suiAddr = existingSuiAddress || createdSuiAddress;
    if (suiAddr) {
      useOnboarding.setState({ suiAddress: suiAddr });
    }
    useOnboarding.setState({ step: 'funding', error: null });
  } catch {
    if (retryCount < MAX_RETRY_ATTEMPTS) {
      isRegistering = false;
      retryTimer = setTimeout(
        () => registerWithRetry(retryCount + 1),
        RETRY_DELAYS_MS[retryCount]
      );
      return;
    }
    useOnboarding.setState({
      error: 'Wallet setup failed. Please try again.',
    });
  } finally {
    isRegistering = false;
  }
};

const linkWithRetry = async (retryCount = 0) => {
  const { userId } = useOnboarding.getState();
  if (!userId || isLinking) return;
  if (isUserLinked(userId)) return;

  isLinking = true;
  useOnboarding.setState({ step: 'linking', error: null });

  try {
    await linkSolanaWallet(userId);
    writeStorage(WALLETS_LINKED_KEY, userId);
    useOnboarding.setState({ step: 'complete' });
  } catch (error) {
    if (error instanceof ApiRequestError && error.code === 'INSUFFICIENT_GAS') {
      isLinking = false;
      useOnboarding.setState({ step: 'funding' });
      return;
    }

    if (retryCount < MAX_RETRY_ATTEMPTS) {
      isLinking = false;
      retryTimer = setTimeout(
        () => linkWithRetry(retryCount + 1),
        RETRY_DELAYS_MS[retryCount]
      );
      return;
    }
    useOnboarding.setState({
      error: 'Wallet linking failed. Please try again.',
    });
  } finally {
    isLinking = false;
  }
};

// --- Store ---

const initialState = {
  step: 'creating-wallets' as OnboardingStep,
  error: null as string | null,
  suiAddress: null as string | null,
  userId: null as string | null,
};

export const useOnboarding = create<OnboardingState>((set, get) => ({
  ...initialState,

  registerWallets: (params) => {
    registrationParams = params;
    registerWithRetry(0);
  },

  linkWallets: () => {
    isLinking = false;
    linkWithRetry(0);
  },

  retry: () => {
    clearTimeout(retryTimer);
    const { step } = get();
    if (step === 'creating-wallets') {
      isRegistering = false;
      registerWithRetry(0);
    } else {
      isLinking = false;
      linkWithRetry(0);
    }
  },

  reset: () => {
    clearTimeout(retryTimer);
    isRegistering = false;
    isLinking = false;
    registrationParams = null;
    set(initialState);
  },

  cleanup: () => {
    clearTimeout(retryTimer);
  },
}));
