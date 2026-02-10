import { useMemo } from 'react';

import { ASSET_METADATA } from '@/constants';
import type { AssetMetadata } from '@/interface';

const useMetadata = (rawTypes: ReadonlyArray<string>) => {
  const typesKey = rawTypes.join(',');
  // biome-ignore lint/correctness/useExhaustiveDependencies: rawTypes is derived from typesKey
  const metadata = useMemo(() => {
    const types = rawTypes.filter((type) => type);
    return types.reduce(
      (acc, type) =>
        ASSET_METADATA[type] ? { ...acc, [type]: ASSET_METADATA[type] } : acc,
      {} as Record<string, AssetMetadata>
    );
  }, [typesKey]);

  return {
    data: metadata,
    isLoading: false,
  };
};

export default useMetadata;
