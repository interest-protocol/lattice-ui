import BigNumber from 'bignumber.js';

import type { BigNumberish } from '@/interface';

const MAX_BPS = 10000;

export const ZERO_BIG_NUMBER = new BigNumber(0);

export const isHexString = (value: unknown, length?: number): boolean => {
  if (typeof value !== 'string' || !/^0x[0-9A-Fa-f]*$/.test(value)) {
    return false;
  }
  return !length || value.length === 2 + 2 * length;
};

export const isBigNumberish = (value: unknown): value is BigNumberish =>
  value != null &&
  (BigNumber.isBigNumber(value) ||
    (typeof value === 'number' && value % 1 === 0) ||
    (typeof value === 'string' && /^-?[0-9]+$/.test(value)) ||
    isHexString(value) ||
    typeof value === 'bigint');

export const parseBigNumberish = (value: unknown): BigNumber => {
  if (value == null) return ZERO_BIG_NUMBER;
  try {
    const bn = new BigNumber(String(value));
    return bn.isFinite() ? bn : ZERO_BIG_NUMBER;
  } catch {
    return ZERO_BIG_NUMBER;
  }
};

export const parseToPositiveStringNumber = (x: string): string => {
  if (Number.isNaN(+x) || +x < 0) return '0';
  return x;
};

export const feesCalcUp = (
  feeBps: number,
  amount: BigNumber
): [BigNumber, BigNumber] => {
  const [fee, value, maxBps] = [
    feeBps,
    String(amount.decimalPlaces(0, 1)),
    MAX_BPS,
  ].map(BigInt);

  const fees =
    (fee * value) / maxBps + BigInt((fee * value) % maxBps > BigInt(0) ? 1 : 0);

  return [BigNumber(String(value - fees)), BigNumber(String(fees))];
};
