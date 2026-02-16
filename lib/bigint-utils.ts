import invariant from 'tiny-invariant';

export const formatUnits = (value: bigint, decimals: number): string => {
  const isNeg = value < 0n;
  const abs = isNeg ? -value : value;
  const str = abs.toString().padStart(decimals + 1, '0');
  const intPart = str.slice(0, str.length - decimals);
  const fracPart = str.slice(str.length - decimals).replace(/0+$/, '');
  const result = fracPart ? `${intPart}.${fracPart}` : intPart;
  return isNeg ? `-${result}` : result;
};

export const parseUnits = (value: string, decimals: number): bigint => {
  if (!value || value === '0') return 0n;

  const isNeg = value.startsWith('-');
  const abs = isNeg ? value.slice(1) : value;

  const [intPart = '0', fracPart = ''] = abs.split('.');
  const trimmedFrac = fracPart.slice(0, decimals).padEnd(decimals, '0');

  const raw = BigInt(intPart) * 10n ** BigInt(decimals) + BigInt(trimmedFrac);
  return isNeg ? -raw : raw;
};

export const toSignificant = (
  value: bigint,
  decimals: number,
  sig: number
): string => {
  const num = Number(formatUnits(value, decimals));
  return num.toPrecision(sig).replace(/\.?0+$/, '');
};

export const bigintDivUp = (a: bigint, b: bigint): bigint => {
  invariant(b !== 0n, 'Division by zero');
  const result = a / b;
  return a % b !== 0n ? result + 1n : result;
};
