import type { SWRConfiguration } from 'swr';

export const balanceSwrConfig: SWRConfiguration = {
  refreshInterval: 30_000,
  revalidateOnFocus: false,
  dedupingInterval: 5_000,
};

export const priceSwrConfig: SWRConfiguration = {
  refreshInterval: 60_000,
  revalidateOnFocus: false,
};

export const healthSwrConfig: SWRConfiguration = {
  refreshInterval: 15_000,
  revalidateOnFocus: false,
};

export const staticSwrConfig: SWRConfiguration = {
  refreshInterval: 300_000,
  revalidateOnFocus: false,
  dedupingInterval: 60_000,
};
