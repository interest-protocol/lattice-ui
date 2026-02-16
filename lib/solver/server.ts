import invariant from 'tiny-invariant';

import { SOLVER_API_URL } from '@/lib/config';
import { SOLVER_API_KEY } from '@/lib/config.server';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

interface SolverRequestOptions {
  timeoutMs?: number;
}

const authHeaders = (): Record<string, string> => ({
  'Content-Type': 'application/json',
  'x-api-key': SOLVER_API_KEY,
});

/**
 * GET with automatic `{ data: T }` unwrap.
 * All solver data endpoints return responses wrapped in a `data` envelope.
 */
const solverGet = async <T>(
  path: string,
  { timeoutMs = 10_000 }: SolverRequestOptions = {}
): Promise<T> => {
  const response = await fetch(`${SOLVER_API_URL}${path}`, {
    headers: authHeaders(),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    const upstream = await response.json().catch(() => null);
    const message =
      upstream?.error ??
      upstream?.message ??
      `Solver API ${path} failed (${response.status})`;
    throw Object.assign(new Error(message), { status: response.status });
  }

  const json = await response.json();
  return json.data as T;
};

/**
 * POST with automatic `{ data: T }` unwrap.
 */
const solverPost = async <T>(
  path: string,
  body: unknown,
  { timeoutMs = 15_000 }: SolverRequestOptions = {}
): Promise<T> => {
  const response = await fetch(`${SOLVER_API_URL}${path}`, {
    method: 'POST',
    headers: authHeaders(),
    signal: AbortSignal.timeout(timeoutMs),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const upstream = await response.json().catch(() => null);
    const message =
      upstream?.error ??
      upstream?.message ??
      `Solver API ${path} failed (${response.status})`;
    throw Object.assign(new Error(message), { status: response.status });
  }

  const json = await response.json();
  return json.data as T;
};

// ---------------------------------------------------------------------------
// Response types (mirrored from client for server-side use)
// ---------------------------------------------------------------------------

export interface SolverMetadata {
  solver: {
    sui: string;
    solana: string;
  };
}

export interface SolverPriceData {
  sui: number;
  sol: number;
}

export interface SolverFulfillResult {
  requestId: string;
  sourceChain: string;
  destinationChain: string;
  sourceAmount: string;
  destinationAmount: string;
  feeBps: number;
  deadline: string;
  destinationTxDigest?: string;
}

export interface SolverRequestStatus {
  status: 'pending' | 'ready_to_settle' | 'settling' | 'settled' | 'failed';
  destinationTxDigest?: string;
  settleTxDigest?: string;
  errorMessage?: string;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** GET /api/v1/metadata */
export const getMetadata = (
  opts?: SolverRequestOptions
): Promise<SolverMetadata> => solverGet<SolverMetadata>('/api/v1/metadata', opts);

/** GET /api/v1/prices */
export const getPrices = (
  opts?: SolverRequestOptions
): Promise<SolverPriceData> => solverGet<SolverPriceData>('/api/v1/prices', opts);

/** GET /api/v1/requests/{requestId} */
export const getRequestStatus = (
  requestId: string,
  opts?: SolverRequestOptions
): Promise<SolverRequestStatus> =>
  solverGet<SolverRequestStatus>(
    `/api/v1/requests/${encodeURIComponent(requestId)}`,
    opts
  );

/** POST /api/v1/fulfill */
export const fulfill = (
  body: {
    requestId: string;
    userAddress: string;
    requestInitialSharedVersion?: string;
  },
  opts?: SolverRequestOptions
): Promise<SolverFulfillResult> =>
  solverPost<SolverFulfillResult>('/api/v1/fulfill', body, opts);

/** POST /api/v1/sign — returns the raw signature string. */
export const sign = async (
  body: { presign: string; message: string; chain: string },
  opts?: SolverRequestOptions
): Promise<string> => {
  const data = await solverPost<{ signature?: string }>(
    '/api/v1/sign',
    body,
    opts
  );
  invariant(
    typeof data.signature === 'string' && data.signature.length > 0,
    'Solver API returned an invalid signature response'
  );
  return data.signature;
};

/** GET /api/health — graceful boolean, no auth key required. */
export const checkHealth = async (
  opts: SolverRequestOptions = {}
): Promise<boolean> => {
  try {
    const response = await fetch(`${SOLVER_API_URL}/api/health`, {
      signal: AbortSignal.timeout(opts.timeoutMs ?? 5_000),
    });
    if (!response.ok) return false;
    const data = await response.json();
    return data.status === 'healthy';
  } catch {
    return false;
  }
};
