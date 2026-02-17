import type { SuiClient } from '@mysten/sui/client';

export const waitForObjects = async (
  suiClient: SuiClient,
  objectIds: string[],
  maxRetries = 8,
  delayMs = 400,
): Promise<void> => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const allExist = objectIds.length === 1
      ? !!(await suiClient.getObject({ id: objectIds[0], options: { showOwner: true } })).data
      : (await suiClient.multiGetObjects({ ids: objectIds, options: { showOwner: true } }))
          .every((obj) => obj.data);

    if (allExist) return;

    if (attempt < maxRetries - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw new Error(`Objects not queryable after ${maxRetries} retries: ${objectIds.join(', ')}`);
};
