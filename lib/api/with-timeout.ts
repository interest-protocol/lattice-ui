/**
 * Wraps a promise with a timeout. Rejects with a descriptive error if the
 * operation doesn't complete within the given duration.
 *
 * Useful for SDK calls (Privy, Sui, Solana, Registry) that don't support
 * AbortSignal natively.
 */
export const withTimeout = <T>(
  promise: Promise<T>,
  ms: number,
  label = 'Operation'
): Promise<T> =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`${label} timed out after ${ms}ms`)),
        ms
      )
    ),
  ]);
