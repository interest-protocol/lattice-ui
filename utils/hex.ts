/**
 * Strip the leading `0x` prefix from a hex string.
 */
export const strip0xPrefix = (hex: string): string => hex.replace(/^0x/, '');
