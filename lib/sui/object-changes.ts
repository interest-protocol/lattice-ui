type ObjectChange = {
  type: string;
  objectType?: string;
  objectId?: string;
  version?: string;
};

export const findCreatedObject = (
  objectChanges: readonly ObjectChange[] | null | undefined,
  typeName: string
): ObjectChange | undefined =>
  objectChanges?.find(
    (c) => c.type === 'created' && c.objectType?.includes(typeName)
  );

export const findCreatedObjectId = (
  objectChanges: readonly ObjectChange[] | null | undefined,
  typeName: string
): string | null => {
  const match = findCreatedObject(objectChanges, typeName);
  return match?.objectId ?? null;
};
