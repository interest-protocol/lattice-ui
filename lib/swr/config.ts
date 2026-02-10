import type { SWRConfiguration } from 'swr';

/**
 * Standardized SWR configuration for balance fetching.
 * - 30 second refresh interval
 * - No revalidation on focus (prevents unnecessary API calls)
 * - 5 second deduping (prevents duplicate requests)
 */
export const balanceSwrConfig: SWRConfiguration = {
  refreshInterval: 30_000,
  revalidateOnFocus: false,
  dedupingInterval: 5_000,
};

/**
 * Standardized SWR configuration for price fetching.
 * - 60 second refresh interval (prices update less frequently)
 * - No revalidation on focus
 */
export const priceSwrConfig: SWRConfiguration = {
  refreshInterval: 60_000,
  revalidateOnFocus: false,
};

/**
 * Standardized SWR configuration for health checks.
 * - 15 second refresh interval (faster for health monitoring)
 * - No revalidation on focus
 */
export const healthSwrConfig: SWRConfiguration = {
  refreshInterval: 15_000,
  revalidateOnFocus: false,
};

/**
 * Standardized SWR configuration for infrequent data.
 * - 5 minute refresh interval
 * - No revalidation on focus
 */
export const staticSwrConfig: SWRConfiguration = {
  refreshInterval: 300_000,
  revalidateOnFocus: false,
  dedupingInterval: 60_000,
};
