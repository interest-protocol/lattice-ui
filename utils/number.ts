import type { ChangeEvent } from 'react';

export const parseInputEventToNumberString = (
  event: ChangeEvent<HTMLInputElement>,
  max = Number.MAX_SAFE_INTEGER
): string => {
  let value = event.target.value.replace(/[^0-9.]/g, '');

  // Keep only the first decimal point
  const firstDot = value.indexOf('.');
  if (firstDot !== -1) {
    value =
      value.slice(0, firstDot + 1) +
      value.slice(firstDot + 1).replace(/\./g, '');
  }

  const num = Number.parseFloat(value);

  if (Number.isNaN(num)) return '0';
  if (num > max) return String(max);
  if (value.startsWith('0') && !value.startsWith('0.')) return String(num);

  return value;
};
