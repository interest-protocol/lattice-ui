import useSWR from 'swr';

import { ASSET_METADATA } from '@/constants';
import type { AssetMetadata } from '@/interface';

const useMetadata = (rawTypes: ReadonlyArray<string>) => {
  const types = rawTypes.filter((type) => type);

  // Immediately return local metadata for known types (SUI, SOL)
  const localMetadata = types.reduce(
    (acc, type) =>
      ASSET_METADATA[type] ? { ...acc, [type]: ASSET_METADATA[type] } : acc,
    {} as Record<string, AssetMetadata>
  );

  const missingTypes = types.filter((type) => !ASSET_METADATA[type]);

  // Only use SWR for fetching missing metadata from API
  const { data: fetchedMetadata, isLoading } = useSWR<
    Record<string, AssetMetadata>
  >(missingTypes.length ? [useMetadata.name, missingTypes] : null, async () => {
    const response = await fetch(
      `https://coin-metadata-api-production.up.railway.app/api/v1/fetch-coins?coinTypes=${missingTypes}`
    );
    const data: ReadonlyArray<AssetMetadata> = await response.json();
    return data.reduce(
      (acc, item) => ({
        ...acc,
        [item.type]: item,
      }),
      {}
    );
  });

  // Return combined metadata: local (always available) + fetched (if any)
  return {
    data: {
      ...localMetadata,
      ...(fetchedMetadata || {}),
    },
    isLoading: missingTypes.length > 0 && isLoading,
  };
};

export default useMetadata;
