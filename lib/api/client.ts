export interface ApiError {
  error: string;
  code?: string;
  status?: number;
}

export class ApiRequestError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
  }
}

interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  signal?: AbortSignal;
}

const DEFAULT_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
};

type TokenGetter = () => Promise<string | null>;

let _getAccessToken: TokenGetter | null = null;

export const setAccessTokenGetter = (getter: TokenGetter): void => {
  _getAccessToken = getter;
};

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  if (!_getAccessToken) return {};
  const token = await _getAccessToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};

const DEFAULT_TIMEOUT = 10_000;
const DEFAULT_RETRIES = 2;
const RETRY_DELAY = 1000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchWithTimeout = async (
  url: string,
  init: RequestInit,
  timeout: number,
  externalSignal?: AbortSignal
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const onExternalAbort = () => controller.abort();
  externalSignal?.addEventListener('abort', onExternalAbort, { once: true });

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
    externalSignal?.removeEventListener('abort', onExternalAbort);
  }
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: `Request failed with status ${response.status}`,
    }));
    throw new ApiRequestError(
      error.error || 'Request failed',
      response.status,
      error.code
    );
  }

  return response.json();
};

const executeWithRetry = async <T>(
  fn: () => Promise<T>,
  retries: number,
  signal?: AbortSignal
): Promise<T> => {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (signal?.aborted) {
      throw new DOMException('The operation was aborted.', 'AbortError');
    }

    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry if the signal was aborted
      if (signal?.aborted) throw lastError;

      if (attempt < retries) {
        const jitter = Math.random() * 500;
        await sleep(RETRY_DELAY * (attempt + 1) + jitter);
      }
    }
  }

  throw lastError;
};

export const post = async <TResponse, TBody = unknown>(
  url: string,
  body: TBody,
  options?: RequestOptions
): Promise<TResponse> => {
  const timeout = options?.timeout ?? DEFAULT_TIMEOUT;
  const retries = options?.retries ?? DEFAULT_RETRIES;

  return executeWithRetry(
    async () => {
      const authHeaders = await getAuthHeaders();
      const response = await fetchWithTimeout(
        url,
        {
          method: 'POST',
          headers: { ...DEFAULT_HEADERS, ...authHeaders, ...options?.headers },
          body: JSON.stringify(body),
        },
        timeout,
        options?.signal
      );

      return handleResponse<TResponse>(response);
    },
    retries,
    options?.signal
  );
};

export const get = async <TResponse>(
  url: string,
  options?: RequestOptions
): Promise<TResponse> => {
  const timeout = options?.timeout ?? DEFAULT_TIMEOUT;
  const retries = options?.retries ?? DEFAULT_RETRIES;

  return executeWithRetry(
    async () => {
      const authHeaders = await getAuthHeaders();
      const response = await fetchWithTimeout(
        url,
        {
          method: 'GET',
          headers: { ...DEFAULT_HEADERS, ...authHeaders, ...options?.headers },
        },
        timeout,
        options?.signal
      );

      return handleResponse<TResponse>(response);
    },
    retries,
    options?.signal
  );
};
