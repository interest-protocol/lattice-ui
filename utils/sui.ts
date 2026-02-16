import { normalizeStructTag, normalizeSuiAddress } from '@mysten/sui/utils';

export const normalizeSuiCoinType = (type: string): string =>
  type.includes('::') ? normalizeStructTag(type) : type;

export const coinTypeEquals = (a: string, b: string): boolean =>
  normalizeSuiCoinType(a) === normalizeSuiCoinType(b);

export const suiAddressEquals = (a: string, b: string): boolean =>
  normalizeSuiAddress(a) === normalizeSuiAddress(b);

export { normalizeSuiAddress };
