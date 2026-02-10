export const nftTypeFromType = (type: string) =>
  type?.startsWith('nft:') ? type : `nft:${type}`;
