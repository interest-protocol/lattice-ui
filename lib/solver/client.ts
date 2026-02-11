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
  status: 'pending' | 'sending' | 'settling' | 'settled' | 'failed';
  destinationTxDigest?: string;
  settleTxDigest?: string;
  errorMessage?: string;
}

export const fetchMetadata = () => get<SolverMetadata>('/api/solver/metadata');

export const fetchPrices = () => get<PriceData>('/api/solver/prices');

export const fulfill = (params: {
  requestId: string;
  userAddress: string;
  requestInitialSharedVersion?: string;
}) => post<FulfillResult>('/api/solver/fulfill', params);

export const fetchStatus = (requestId: string) =>
  get<RequestStatus>(
    `/api/solver/status?requestId=${encodeURIComponent(requestId)}`
  );

export const waitForSettlement = async (
  requestId: string,
  options: { maxPolls?: number; intervalMs?: number; signal?: AbortSignal } = {}
): Promise<RequestStatus> => {
  const { maxPolls = 120, intervalMs = 1000, signal } = options;

  for (let i = 0; i < maxPolls; i++) {
    if (signal?.aborted) {
      throw new DOMException('The operation was aborted.', 'AbortError');
    }

    const status = await fetchStatus(requestId);

    if (status.status === 'settled' || status.status === 'failed') {
      return status;
    }

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, intervalMs);
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
