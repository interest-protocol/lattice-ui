import type { SuiClient, SuiObjectData, SuiObjectDataOptions } from '@mysten/sui/client';

export interface WaitForObjectsOptions {
  maxRetries?: number;
  delayMs?: number;
  objectDataOptions?: SuiObjectDataOptions;
}

export const waitForObjects = async (
  suiClient: SuiClient,
  objectIds: string[],
  options?: WaitForObjectsOptions,
): Promise<SuiObjectData[]> => {
  if (objectIds.length === 0) return [];

  const { maxRetries = 8, delayMs = 400, objectDataOptions } = options ?? {};
  const mergedOptions: SuiObjectDataOptions = { showOwner: true, ...objectDataOptions };

  let results: (SuiObjectData | null | undefined)[] = [];

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    results = objectIds.length === 1
      ? [(await suiClient.getObject({ id: objectIds[0], options: mergedOptions })).data]
      : (await suiClient.multiGetObjects({ ids: objectIds, options: mergedOptions }))
          .map((obj) => obj.data);

    if (results.every((d): d is SuiObjectData => !!d)) return results;

    if (attempt < maxRetries - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  const missing = objectIds.filter((_, i) => !results[i]);
  throw new Error(`Objects not queryable after ${maxRetries} retries: ${missing.join(', ')}`);
};
