import { toast } from 'react-hot-toast';

export interface ErrorHandlerOptions {
  /** Whether to show a toast notification to the user */
  shouldToast?: boolean;
  /** Context string to prepend to error messages (e.g., "Swap failed") */
  context?: string;
  /** Custom toast message (overrides extracted error message) */
  toastMessage?: string;
  /** Duration for the toast in milliseconds */
  toastDuration?: number;
}

/**
 * Extracts a user-friendly message from an error.
 */
export const extractErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }
  return 'An unexpected error occurred';
};

/**
 * Centralized error handler for consistent error handling across the app.
 *
 * @param error - The error to handle
 * @param options - Configuration options
 * @returns The extracted error message
 *
 * @example
 * try {
 *   await performSwap();
 * } catch (error) {
 *   handleError(error, { shouldToast: true, context: 'Swap' });
 * }
 */
export const handleError = (
  error: unknown,
  options: ErrorHandlerOptions = {}
): string => {
  const { shouldToast = false, context, toastMessage, toastDuration } = options;

  const message = extractErrorMessage(error);
  const fullMessage = context ? `${context}: ${message}` : message;

  // Always log to console for debugging
  console.error(fullMessage, error);

  if (shouldToast) {
    toast.error(toastMessage ?? message, {
      duration: toastDuration ?? 4000,
    });
  }

  return fullMessage;
};

/**
 * Creates a retry function with exponential backoff.
 *
 * @param fn - The async function to retry
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param baseDelayMs - Base delay in milliseconds (default: 2000)
 * @returns A promise that resolves when fn succeeds or rejects after all retries fail
 *
 * @example
 * await withRetry(() => registerWallets(), 3, 2000);
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 2000
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        // Exponential backoff: 2s, 4s, 8s, etc.
        const delay = baseDelayMs * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};

export default handleError;
