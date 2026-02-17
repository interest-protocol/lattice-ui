import invariant from 'tiny-invariant';

import { SOLVER_API_URL } from '@/lib/config';
import { SOLVER_API_KEY } from '@/lib/config.server';

interface SolverRequestOptions {
  timeoutMs?: number;
}

const authHeaders = (): Record<string, string> => ({
  'Content-Type': 'application/json',
  'x-api-key': SOLVER_API_KEY,
});

const handleSolverError = async (
  response: Response,
  path: string
): Promise<never> => {
  const upstream = await response.json().catch(() => null);
  const message =
    upstream?.error ??
    upstream?.message ??
    `Solver API ${path} failed (${response.status})`;
  throw Object.assign(new Error(message), { status: response.status });
};

const solverGet = async <T>(
  path: string,
  { timeoutMs = 10_000 }: SolverRequestOptions = {}
): Promise<T> => {
  const response = await fetch(`${SOLVER_API_URL}${path}`, {
    headers: authHeaders(),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) await handleSolverError(response, path);

  const json = await response.json();
  if (json.data === undefined) {
    throw new Error(`Solver API ${path}: response missing 'data' field`);
  }
  return json.data as T;
};

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

  if (!response.ok) await handleSolverError(response, path);

  const json = await response.json();
  if (json.data === undefined) {
    throw new Error(`Solver API ${path}: response missing 'data' field`);
  }
  return json.data as T;
};

export interface SolverChainInfo {
  chainId: number;
  name: string;
  rpcUrl: string;
  nativeToken: {
    address: string;
    decimals: number;
    symbol: string;
  };
}

export interface SolverMetadata {
  solver: {
    sui: string;
    solana: string;
  };
  chains: SolverChainInfo[];
  supportedPairs: { source: number; destination: number }[];
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

export const getMetadata = (
  opts?: SolverRequestOptions
): Promise<SolverMetadata> => solverGet<SolverMetadata>('/api/v1/metadata', opts);

export const getPrices = (
  opts?: SolverRequestOptions
): Promise<SolverPriceData> => solverGet<SolverPriceData>('/api/v1/prices', opts);

export const getRequestStatus = (
  requestId: string,
  opts?: SolverRequestOptions
): Promise<SolverRequestStatus> =>
  solverGet<SolverRequestStatus>(
    `/api/v1/requests/${encodeURIComponent(requestId)}`,
    opts
  );

export const fulfill = (
  body: {
    requestId: string;
    userAddress: string;
    requestInitialSharedVersion?: string;
  },
  opts?: SolverRequestOptions
): Promise<SolverFulfillResult> =>
  solverPost<SolverFulfillResult>('/api/v1/fulfill', body, opts);

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
