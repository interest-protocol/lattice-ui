import type { ChangeEvent } from 'react';

export const parseInputEventToNumberString = (
  event: ChangeEvent<HTMLInputElement>,
  max = Number.MAX_SAFE_INTEGER
): string => {
  const value = event.target.value.replace(/[^0-9.]/g, '');
  const num = Number.parseFloat(value);

  if (Number.isNaN(num) || num < 0) return '0';
  if (num > max) return String(max);
  if (value.startsWith('0') && !value.startsWith('0.')) return String(num);

  return value;
};
