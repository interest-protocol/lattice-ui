/**
 * Filters a string to allow only valid decimal number input.
 * Strips non-numeric characters (except `.`) and prevents multiple dots.
 */
export const filterDecimalInput = (value: string): string => {
  const filtered = value.replace(/[^0-9.]/g, '');
  const firstDot = filtered.indexOf('.');
  if (firstDot !== -1) {
    return (
      filtered.slice(0, firstDot + 1) +
      filtered.slice(firstDot + 1).replace(/\./g, '')
    );
  }
  return filtered;
};
