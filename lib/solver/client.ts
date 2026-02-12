import { get, post } from '@/lib/api/client';

export interface SolverMetadata {
  solver: {
    sui: string;
    solana: string;
  };
}

export interface PriceData {
  sui: number;
  sol: number;
}

export interface FulfillResult {
  requestId: string;
  sourceChain: string;
  destinationChain: string;
  sourceAmount: string;
  destinationAmount: string;
  feeBps: number;
  deadline: string;
  destinationTxDigest?: string;
}

export interface RequestStatus {
  status: 'pending' | 'ready_to_settle' | 'settling' | 'settled' | 'failed';
  destinationTxDigest?: string;
  settleTxDigest?: string;
  errorMessage?: string;
}

export const fetchMetadata = (signal?: AbortSignal) =>
  get<SolverMetadata>('/api/solver/metadata', { signal });

export const fetchPrices = (signal?: AbortSignal) =>
  get<PriceData>('/api/solver/prices', { signal });

export const fulfill = (
  params: {
    requestId: string;
    userAddress: string;
    requestInitialSharedVersion?: string;
  },
  signal?: AbortSignal
) => post<FulfillResult>('/api/solver/fulfill', params, { signal });

export const fetchStatus = (requestId: string, signal?: AbortSignal) =>
  get<RequestStatus>(
    `/api/solver/status?requestId=${encodeURIComponent(requestId)}`,
    { signal }
  );

export const waitForSettlement = async (
  requestId: string,
  options: {
    maxPolls?: number;
    initialIntervalMs?: number;
    maxIntervalMs?: number;
    signal?: AbortSignal;
  } = {}
): Promise<RequestStatus> => {
  const {
    maxPolls = 120,
    initialIntervalMs = 500,
    maxIntervalMs = 4000,
    signal,
  } = options;

  for (let i = 0; i < maxPolls; i++) {
    if (signal?.aborted) {
      throw new DOMException('The operation was aborted.', 'AbortError');
    }

    const status = await fetchStatus(requestId, signal);

    if (status.status === 'settled' || status.status === 'failed') {
      return status;
    }

    const delay =
      Math.min(initialIntervalMs * 2 ** i, maxIntervalMs) + Math.random() * 300;
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, delay);
      signal?.addEventListener(
        'abort',
        () => {
          clearTimeout(timer);
          reject(new DOMException('The operation was aborted.', 'AbortError'));
        },
        { once: true }
      );
    });
  }

  throw new Error('Settlement timeout');
};
