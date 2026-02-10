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
}

const DEFAULT_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
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

export const post = async <TResponse, TBody = unknown>(
  url: string,
  body: TBody,
  options?: RequestOptions
): Promise<TResponse> => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { ...DEFAULT_HEADERS, ...options?.headers },
    body: JSON.stringify(body),
  });

  return handleResponse<TResponse>(response);
};

export const get = async <TResponse>(
  url: string,
  options?: RequestOptions
): Promise<TResponse> => {
  const response = await fetch(url, {
    method: 'GET',
    headers: { ...DEFAULT_HEADERS, ...options?.headers },
  });

  return handleResponse<TResponse>(response);
};
