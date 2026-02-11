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
  fulfillmentId: string;
  status: string;
  destinationAmount?: string;
  feeBps?: number;
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
  options: { maxPolls?: number; intervalMs?: number } = {}
): Promise<RequestStatus> => {
  const { maxPolls = 120, intervalMs = 1000 } = options;

  for (let i = 0; i < maxPolls; i++) {
    const status = await fetchStatus(requestId);

    if (status.status === 'settled' || status.status === 'failed') {
      return status;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error('Settlement timeout');
};
