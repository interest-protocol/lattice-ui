export const formatMoney = (value: number, maxDecimals = 2): string =>
  new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: maxDecimals,
  }).format(value);

export const formatDollars = (value: number, maxDecimals = 2): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: maxDecimals,
  }).format(value);
