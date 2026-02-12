export const extractErrorMessage = (
  error: unknown,
  fallback = 'An error occurred'
): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (
    error !== null &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }
  return fallback;
};
