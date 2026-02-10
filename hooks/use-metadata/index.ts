import { ASSET_METADATA } from '@/constants';
import type { AssetMetadata } from '@/interface';

const useMetadata = (rawTypes: ReadonlyArray<string>) => {
  const types = rawTypes.filter((type) => type);

  // Return local metadata for known types (only 4 supported coins)
  const metadata = types.reduce(
    (acc, type) =>
      ASSET_METADATA[type] ? { ...acc, [type]: ASSET_METADATA[type] } : acc,
    {} as Record<string, AssetMetadata>
  );

  return {
    data: metadata,
    isLoading: false,
  };
};

export default useMetadata;
