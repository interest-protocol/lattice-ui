import { fetchWithRetry } from '@/lib/api/fetch-with-retry';
import { ENCLAVE_API_KEY, ENCLAVE_URL } from '@/lib/config.server';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

interface EnclaveRequestOptions {
  timeoutMs?: number;
}

const authHeaders = (): Record<string, string> => ({
  'Content-Type': 'application/json',
  'x-api-key': ENCLAVE_API_KEY,
});

/**
 * POST to the enclave API (no retry).
 */
const enclavePost = async <T>(
  path: string,
  body: unknown,
  { timeoutMs = 10_000 }: EnclaveRequestOptions = {}
): Promise<T> => {
  const response = await fetch(`${ENCLAVE_URL}${path}`, {
    method: 'POST',
    headers: authHeaders(),
    signal: AbortSignal.timeout(timeoutMs),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => `HTTP ${response.status}`);
    throw Object.assign(new Error(text), { status: response.status });
  }

  return response.json() as Promise<T>;
};

/**
 * POST to the enclave API with retry. Used for xbridge operations where
 * RPC propagation delays can cause transient failures.
 */
const enclavePostWithRetry = async <T>(
  path: string,
  body: unknown,
  { timeoutMs = 10_000 }: EnclaveRequestOptions = {}
): Promise<T> => {
  const response = await fetchWithRetry(`${ENCLAVE_URL}${path}`, {
    method: 'POST',
    headers: authHeaders(),
    signal: AbortSignal.timeout(timeoutMs),
    body: JSON.stringify(body),
  });

  return response.json() as Promise<T>;
};

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

export interface NewRequestProofRaw {
  signature: string;
  response: {
    digest: number[];
    chain_id: number;
    dwallet_address: number[];
    user: number[];
    token: number[];
    amount: number[];
  };
  timestamp_ms: string;
}

export interface EnclaveVoteResult {
  signature: string;
  timestamp_ms: string;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** POST /new_request */
export const newRequest = (
  body: { digest: string; chain_id: number },
  opts?: EnclaveRequestOptions
): Promise<NewRequestProofRaw> =>
  enclavePost<NewRequestProofRaw>('/new_request', body, opts);

/** POST /xbridge/vote_burn (with retry) */
export const voteBurn = (
  body: Record<string, unknown>,
  opts?: EnclaveRequestOptions
): Promise<EnclaveVoteResult> =>
  enclavePostWithRetry<EnclaveVoteResult>('/xbridge/vote_burn', body, opts);

/** POST /xbridge/vote_mint (with retry) */
export const voteMint = (
  body: Record<string, unknown>,
  opts?: EnclaveRequestOptions
): Promise<EnclaveVoteResult> =>
  enclavePostWithRetry<EnclaveVoteResult>('/xbridge/vote_mint', body, opts);

/** GET /health_check — graceful boolean, no auth key required. */
export const checkHealth = async (
  opts: EnclaveRequestOptions = {}
): Promise<boolean> => {
  try {
    const response = await fetch(`${ENCLAVE_URL}/health_check`, {
      signal: AbortSignal.timeout(opts.timeoutMs ?? 5_000),
    });
    if (!response.ok) return false;
    await response.json();
    return true;
  } catch {
    return false;
  }
};
