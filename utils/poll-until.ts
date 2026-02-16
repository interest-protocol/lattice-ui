export interface PollOptions {
  maxPolls?: number;
  intervalMs?: number;
  maxIntervalMs?: number;
  backoff?: boolean;
  jitterMs?: number;
  signal?: AbortSignal;
}

const abortAwareSleep = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('The operation was aborted.', 'AbortError'));
      return;
    }

    const timer = setTimeout(resolve, ms);

    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new DOMException('The operation was aborted.', 'AbortError'));
      },
      { once: true }
    );
  });

export const pollUntil = async <T>(
  fn: () => Promise<T | null | undefined>,
  options: PollOptions = {}
): Promise<T> => {
  const {
    maxPolls = 60,
    intervalMs = 1_000,
    maxIntervalMs = intervalMs,
    backoff = false,
    jitterMs = 0,
    signal,
  } = options;

  for (let i = 0; i < maxPolls; i++) {
    if (signal?.aborted) {
      throw new DOMException('The operation was aborted.', 'AbortError');
    }

    const result = await fn();

    if (result != null) return result;

    const base = backoff
      ? Math.min(intervalMs * 2 ** i, maxIntervalMs)
      : intervalMs;

    const delay = base + Math.random() * jitterMs;

    await abortAwareSleep(delay, signal);
  }

  throw new Error('Poll timeout');
};
