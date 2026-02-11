import { normalizeSuiAddress, normalizeStructTag } from '@mysten/sui/utils';

/** Normalize a SUI coin type (struct tag) for reliable comparison. Non-SUI types pass through unchanged. */
export const normalizeSuiCoinType = (type: string): string =>
  type.includes('::') ? normalizeStructTag(type) : type;

/** Compare two coin types for equality, normalizing SUI struct tags. */
export const coinTypeEquals = (a: string, b: string): boolean =>
  normalizeSuiCoinType(a) === normalizeSuiCoinType(b);

/** Compare two SUI addresses for equality regardless of padding/prefix. */
export const suiAddressEquals = (a: string, b: string): boolean =>
  normalizeSuiAddress(a) === normalizeSuiAddress(b);

export { normalizeSuiAddress };
