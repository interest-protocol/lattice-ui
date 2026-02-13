type ObjectChange = {
  type: string;
  objectType?: string;
  objectId?: string;
  version?: string;
};

/**
 * Find a created object from a transaction's objectChanges
 * by matching a substring in its objectType.
 */
export const findCreatedObject = (
  objectChanges: readonly ObjectChange[] | null | undefined,
  typeName: string
): ObjectChange | undefined =>
  objectChanges?.find(
    (c) => c.type === 'created' && c.objectType?.includes(typeName)
  );

/**
 * Extract the objectId of a created object from a transaction's objectChanges
 * by matching a substring in its objectType.
 */
export const findCreatedObjectId = (
  objectChanges: readonly ObjectChange[] | null | undefined,
  typeName: string
): string | null => {
  const match = findCreatedObject(objectChanges, typeName);
  return match?.objectId ?? null;
};
