import { useMemo } from 'react';

import { ASSET_METADATA } from '@/constants';
import type { AssetMetadata } from '@/interface';

const useMetadata = (rawTypes: ReadonlyArray<string>) => {
  const typesKey = rawTypes.join(',');
  const metadata = useMemo(() => {
    const types = rawTypes.filter((type) => type);
    return types.reduce(
      (acc, type) =>
        ASSET_METADATA[type] ? { ...acc, [type]: ASSET_METADATA[type] } : acc,
      {} as Record<string, AssetMetadata>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typesKey]);

  return {
    data: metadata,
    isLoading: false,
  };
};

export default useMetadata;
