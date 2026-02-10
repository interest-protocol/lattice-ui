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

export const fetchMetadata = async (): Promise<SolverMetadata> => {
  const response = await fetch('/api/solver/metadata');

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch metadata');
  }

  return response.json();
};

export const fetchPrices = async (): Promise<PriceData> => {
  const response = await fetch('/api/solver/prices');

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch prices');
  }

  return response.json();
};

export const fulfill = async (params: {
  requestId: string;
  userAddress: string;
  requestInitialSharedVersion?: string;
}): Promise<FulfillResult> => {
  const response = await fetch('/api/solver/fulfill', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fulfill request');
  }

  return response.json();
};

export const fetchStatus = async (
  requestId: string
): Promise<RequestStatus> => {
  const response = await fetch(`/api/solver/status?requestId=${requestId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch status');
  }

  return response.json();
};

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
