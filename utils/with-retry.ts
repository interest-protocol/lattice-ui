/**
 * Retries an async function with exponential backoff and abort support.
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  attempts: number,
  baseDelayMs: number,
  signal?: AbortSignal,
  maxDelayMs?: number
): Promise<T> => {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === attempts - 1) throw err;
      if (signal?.aborted) {
        throw new DOMException('The operation was aborted.', 'AbortError');
      }
      const delay = maxDelayMs
        ? Math.min(baseDelayMs * 2 ** i, maxDelayMs)
        : baseDelayMs;
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, delay);
        signal?.addEventListener(
          'abort',
          () => {
            clearTimeout(timer);
            reject(
              new DOMException('The operation was aborted.', 'AbortError')
            );
          },
          { once: true }
        );
      });
    }
  }
  throw new Error('Retry exhausted');
};
