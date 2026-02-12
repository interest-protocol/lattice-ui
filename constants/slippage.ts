export const DEFAULT_SLIPPAGE_BPS = 50;

export const MIN_SLIPPAGE_BPS = 1; // 0.01%
export const MAX_SLIPPAGE_BPS = 5000; // 50%

export const SLIPPAGE_OPTIONS = [10, 50, 100, 200] as const;

export type SlippagePreset = (typeof SLIPPAGE_OPTIONS)[number];

export const SLIPPAGE_DISPLAY: Record<SlippagePreset, string> = {
  10: '0.1%',
  50: '0.5%',
  100: '1.0%',
  200: '2.0%',
};

export const isSlippagePreset = (bps: number): bps is SlippagePreset =>
  (SLIPPAGE_OPTIONS as readonly number[]).includes(bps);
