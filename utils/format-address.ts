export const formatAddress = (
  address: string,
  prefixLen = 6,
  suffixLen = 4
): string => {
  if (address.length <= prefixLen + suffixLen) return address;
  return `${address.slice(0, prefixLen)}...${address.slice(-suffixLen)}`;
};
