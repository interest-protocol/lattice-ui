import { post } from '@/lib/api/client';

export interface RequestProof {
  signature: number[];
  digest: number[];
  timestampMs: string;
  dwalletAddress: number[];
  user: number[];
  chainId: number;
  token: number[];
  amount: string;
}

export interface CreateRequestParams {
  userId: string;
  proof: RequestProof;
  walletKey: string;
  sourceAddress: number[];
  sourceChain: number;
  destinationChain: number;
  destinationAddress: number[];
  destinationToken: number[];
  minDestinationAmount: string;
  minConfirmations: number;
  deadline: string;
  solverSender: number[];
  solverRecipient: number[];
}

export interface CreateRequestResult {
  digest: string;
  requestId: string | null;
  requestInitialSharedVersion: string | null;
}

export const createSwapRequest = (
  params: CreateRequestParams,
  signal?: AbortSignal
) => post<CreateRequestResult>('/api/xswap/create-request', params, { signal });
