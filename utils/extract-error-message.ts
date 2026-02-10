export const extractErrorMessage = (
  error: unknown,
  fallback = 'An error occurred'
): string => (error instanceof Error ? error.message : fallback);
