import { BigNumber } from 'bignumber.js';

/** UI-only: no chain. Returns empty balances. */
export const useCoins = () => ({
  coins: {} as Record<string, BigNumber>,
  isLoading: false,
  mutate: () => {},
});
