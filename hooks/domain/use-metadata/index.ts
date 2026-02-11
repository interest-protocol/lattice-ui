import { ASSET_METADATA } from '@/constants';
import type { AssetMetadata } from '@/interface';

const useMetadata = (rawTypes: readonly string[]) => {
  const metadata = Object.fromEntries(
    rawTypes
      .filter((type) => type && type in ASSET_METADATA)
      .map((type) => [type, ASSET_METADATA[type]])
  ) as Record<string, AssetMetadata>;

  return {
    data: metadata,
    isLoading: false,
  };
};

export default useMetadata;
