export const formatAddress = (
  address: string,
  prefixLen = 6,
  suffixLen = 4
): string => `${address.slice(0, prefixLen)}...${address.slice(-suffixLen)}`;
