/**
 * Format a raw bigint token amount into a human-readable decimal string.
 * e.g. formatUnits(1500000000n, 9) => "1.5"
 */
export const formatUnits = (value: bigint, decimals: number): string => {
  const isNeg = value < 0n;
  const abs = isNeg ? -value : value;
  const str = abs.toString().padStart(decimals + 1, '0');
  const intPart = str.slice(0, str.length - decimals);
  const fracPart = str.slice(str.length - decimals).replace(/0+$/, '');
  const result = fracPart ? `${intPart}.${fracPart}` : intPart;
  return isNeg ? `-${result}` : result;
};

/**
 * Parse a human-readable decimal string into a raw bigint amount.
 * e.g. parseUnits("1.5", 9) => 1500000000n
 */
export const parseUnits = (value: string, decimals: number): bigint => {
  if (!value || value === '0') return 0n;

  const isNeg = value.startsWith('-');
  const abs = isNeg ? value.slice(1) : value;

  const [intPart = '0', fracPart = ''] = abs.split('.');
  const trimmedFrac = fracPart.slice(0, decimals).padEnd(decimals, '0');

  const raw = BigInt(intPart) * 10n ** BigInt(decimals) + BigInt(trimmedFrac);
  return isNeg ? -raw : raw;
};

/**
 * Format a bigint as a fixed-decimal string with dp decimal places.
 * e.g. toFixed(1500000000n, 9, 4) => "1.5000"
 */
export const toFixed = (
  value: bigint,
  decimals: number,
  dp: number
): string => {
  const full = formatUnits(value, decimals);
  const [intPart = '0', fracPart = ''] = full.split('.');
  const padded = fracPart.padEnd(dp, '0').slice(0, dp);
  return dp > 0 ? `${intPart}.${padded}` : intPart;
};

/**
 * Format a bigint as a significant-digit string.
 * e.g. toSignificant(1500000000n, 9, 4) => "1.5"
 */
export const toSignificant = (
  value: bigint,
  decimals: number,
  sig: number
): string => {
  const num = Number(formatUnits(value, decimals));
  return num.toPrecision(sig).replace(/\.?0+$/, '');
};

/** Absolute value for bigint */
export const bigintAbs = (value: bigint): bigint =>
  value < 0n ? -value : value;

/** Safe division rounding down */
export const bigintDivDown = (a: bigint, b: bigint): bigint => a / b;

/** Safe division rounding up (ceiling) */
export const bigintDivUp = (a: bigint, b: bigint): bigint => {
  if (b === 0n) throw new Error('Division by zero');
  const result = a / b;
  return a % b !== 0n ? result + 1n : result;
};
