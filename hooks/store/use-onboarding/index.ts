import { create } from 'zustand';

export type OnboardingStep =
  | 'creating-wallets'
  | 'funding'
  | 'linking'
  | 'complete';

interface OnboardingState {
  step: OnboardingStep;
  error: string | null;
  suiAddress: string | null;
  retryLink: (() => void) | null;
  setStep: (step: OnboardingStep) => void;
  setError: (error: string | null) => void;
  setSuiAddress: (address: string) => void;
  setRetryLink: (fn: () => void) => void;
  reset: () => void;
}

const initialState = {
  step: 'creating-wallets' as OnboardingStep,
  error: null,
  suiAddress: null,
  retryLink: null,
};

export const useOnboarding = create<OnboardingState>((set) => ({
  ...initialState,
  setStep: (step) => set({ step, error: null }),
  setError: (error) => set({ error }),
  setSuiAddress: (suiAddress) => set({ suiAddress }),
  setRetryLink: (fn) => set({ retryLink: fn }),
  reset: () => set(initialState),
}));
