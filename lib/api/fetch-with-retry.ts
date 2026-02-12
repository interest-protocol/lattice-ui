/**
 * Retry wrapper for server-side fetch calls.
 * Retries on non-ok responses with a fixed delay between attempts.
 */
export const fetchWithRetry = async (
  input: RequestInfo | URL,
  init: RequestInit,
  { retries = 3, delay = 2_000 } = {}
): Promise<Response> => {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(input, init).catch((err: unknown) => {
      lastError = err instanceof Error ? err : new Error(String(err));
      return null;
    });

    if (response?.ok) return response;

    if (response && attempt === retries) {
      const text = await response.text().catch(() => 'Unknown error');
      throw new Error(text);
    }

    if (!response && attempt === retries) {
      throw lastError ?? new Error('Fetch failed');
    }

    await new Promise((r) => setTimeout(r, delay));
  }

  throw lastError ?? new Error('Fetch failed');
};
