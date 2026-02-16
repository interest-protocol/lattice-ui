type BigNumberish = bigint | number | string;

export const ZERO_BIG_INT = 0n;

export const isHexString = (
  value: unknown,
  length?: number
): value is string => {
  if (typeof value !== 'string' || !/^0x[0-9a-fA-F]+$/.test(value))
    return false;
  if (length !== undefined) {
    const byteLength = (value.length - 2) / 2;
    return byteLength === length;
  }
  return true;
};

export const isBigNumberish = (value: unknown): value is BigNumberish => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'bigint') return true;
  if (typeof value === 'number') return Number.isInteger(value);
  if (typeof value === 'string') {
    if (isHexString(value)) return true;
    try {
      BigInt(value);
      return true;
    } catch {
      return false;
    }
  }
  return false;
};

export const parseBigNumberish = (value: unknown): bigint => {
  if (value === null || value === undefined) return 0n;
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return 0n;
    return BigInt(Math.trunc(value));
  }
  if (typeof value === 'string') {
    if (value === 'Infinity' || value === '-Infinity' || value === 'NaN')
      return 0n;
    try {
      return BigInt(value);
    } catch {
      return 0n;
    }
  }
  return 0n;
};

export const parseToPositiveStringNumber = (value: string): string => {
  const num = Number(value);
  if (Number.isNaN(num) || num < 0) return '0';
  return value;
};

const BPS_DENOMINATOR = 10_000n;

export const feesCalcUp = (
  bps: number,
  amount: bigint
): [afterFee: bigint, fee: bigint] => {
  const bpsBigInt = BigInt(bps);
  const product = bpsBigInt * amount;
  const remainder = product % BPS_DENOMINATOR;
  const fee =
    remainder > 0n
      ? product / BPS_DENOMINATOR + 1n
      : product / BPS_DENOMINATOR;
  const afterFee = amount - fee;
  return [afterFee, fee];
};
