/** UI-only: no fees from chain. */
export const useFees = (_lst: string) => ({
  fees: null as { staking: number; unstaking: number; transmute: number } | null,
  isLoading: false,
  mutate: () => {},
});
