import { useMemo } from 'react';

import { ASSET_METADATA } from '@/constants';
import type { AssetMetadata } from '@/interface';

const useMetadata = (rawTypes: ReadonlyArray<string>) => {
  const typesKey = rawTypes.join(',');
  // biome-ignore lint/correctness/useExhaustiveDependencies: rawTypes is derived from typesKey
  const metadata = useMemo(
    () =>
      Object.fromEntries(
        rawTypes
          .filter((type) => type && type in ASSET_METADATA)
          .map((type) => [type, ASSET_METADATA[type]])
      ) as Record<string, AssetMetadata>,
    [typesKey]
  );

  return {
    data: metadata,
    isLoading: false,
  };
};

export default useMetadata;
