/**
 * Performs a health check against a URL with a timeout.
 * Returns `true` if the endpoint responds with an OK status.
 *
 * @param url - The health check endpoint URL
 * @param options.timeout - Abort timeout in ms (default 5000)
 * @param options.validateBody - Optional predicate to validate the JSON body
 */
export const checkHealth = async (
  url: string,
  options?: {
    timeout?: number;
    validateBody?: (data: unknown) => boolean;
  }
): Promise<boolean> => {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(options?.timeout ?? 5_000),
    });
    if (!response.ok) return false;
    const data = await response.json();
    return options?.validateBody ? options.validateBody(data) : true;
  } catch {
    return false;
  }
};
