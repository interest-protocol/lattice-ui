export type BigIntish = bigint | number | string;

const MAX_BPS = 10000n;

export const ZERO_BIG_INT = 0n;

export const isHexString = (value: unknown, length?: number): boolean => {
  if (typeof value !== 'string' || !/^0x[0-9A-Fa-f]+$/.test(value)) {
    return false;
  }
  return !length || value.length === 2 + 2 * length;
};

export const isBigNumberish = (value: unknown): value is BigIntish =>
  value != null &&
  (typeof value === 'bigint' ||
    (typeof value === 'number' && value % 1 === 0) ||
    (typeof value === 'string' && /^-?[0-9]+$/.test(value)) ||
    isHexString(value));

export const parseBigNumberish = (value: unknown): bigint => {
  if (value == null) return 0n;
  try {
    const str = String(value);
    return BigInt(str);
  } catch {
    return 0n;
  }
};

export const parseToPositiveStringNumber = (x: string): string => {
  if (Number.isNaN(+x) || +x < 0) return '0';
  return x;
};

export const feesCalcUp = (
  feeBps: number,
  amount: bigint
): [bigint, bigint] => {
  const fee = BigInt(feeBps);
  const value = amount;
  const maxBps = MAX_BPS;

  const fees = (fee * value) / maxBps + ((fee * value) % maxBps > 0n ? 1n : 0n);

  return [value - fees, fees];
};
