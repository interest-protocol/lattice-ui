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
}

const DEFAULT_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
};

const DEFAULT_TIMEOUT = 30000;
const DEFAULT_RETRIES = 0;
const RETRY_DELAY = 1000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchWithTimeout = async (
  url: string,
  init: RequestInit,
  timeout: number
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
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
  retries: number
): Promise<T> => {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < retries) {
        await sleep(RETRY_DELAY * (attempt + 1));
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

  return executeWithRetry(async () => {
    const response = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: { ...DEFAULT_HEADERS, ...options?.headers },
        body: JSON.stringify(body),
      },
      timeout
    );

    return handleResponse<TResponse>(response);
  }, retries);
};

export const get = async <TResponse>(
  url: string,
  options?: RequestOptions
): Promise<TResponse> => {
  const timeout = options?.timeout ?? DEFAULT_TIMEOUT;
  const retries = options?.retries ?? DEFAULT_RETRIES;

  return executeWithRetry(async () => {
    const response = await fetchWithTimeout(
      url,
      {
        method: 'GET',
        headers: { ...DEFAULT_HEADERS, ...options?.headers },
      },
      timeout
    );

    return handleResponse<TResponse>(response);
  }, retries);
};
