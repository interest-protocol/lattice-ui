import {
  type ChainId,
  type VoteBurnProofRaw,
  type VoteMintProofRaw,
  XBridgeInbound,
} from '@interest-protocol/xbridge-sdk';

import { post } from '@/lib/api/client';

export type { ChainId };

export interface VoteMintProof {
  signature: Uint8Array;
  requestId: Uint8Array;
  dwalletAddress: Uint8Array;
  sourceChain: ChainId;
  sourceToken: Uint8Array;
  sourceDecimals: number;
  sourceAddress: Uint8Array;
  sourceAmount: bigint;
  digest: Uint8Array;
  timestampMs: bigint;
}

export interface VoteBurnProof {
  signature: Uint8Array;
  requestId: Uint8Array;
  dwalletAddress: Uint8Array;
  sourceChain: ChainId;
  sourceToken: Uint8Array;
  sourceDecimals: number;
  destinationAddress: Uint8Array;
  sourceAmount: bigint;
  message: Uint8Array;
  timestampMs: bigint;
}

export const fetchVoteMintProof = async (
  requestId: string,
  depositDigest: string
): Promise<VoteMintProof> => {
  const raw = await post<unknown>('/api/xbridge/vote-mint', {
    requestId,
    depositDigest,
  });
  return XBridgeInbound.parseVoteMintProof(raw as VoteMintProofRaw);
};

export const fetchVoteBurnProof = async (
  requestId: string
): Promise<VoteBurnProof> => {
  const raw = await post<unknown>('/api/xbridge/vote-burn', { requestId });
  return XBridgeInbound.parseVoteBurnProof(raw as VoteBurnProofRaw);
};

export interface CreateMintRequestResult {
  digest: string;
  requestId: string | null;
  mintCapId: string | null;
}

export interface SetMintDigestResult {
  digest: string;
}

export interface VoteMintResult {
  digest: string;
}

export interface ExecuteMintResult {
  digest: string;
}

export const createMintRequest = (params: {
  userId: string;
  sourceChain: number;
  sourceToken: number[];
  sourceDecimals: number;
  sourceAddress: number[];
  sourceAmount: string;
  coinType: string;
}) => post<CreateMintRequestResult>('/api/xbridge/create-mint-request', params);

export const setMintDigest = (params: {
  userId: string;
  requestId: string;
  mintCapId: string;
  depositSignature: string;
}) => post<SetMintDigestResult>('/api/xbridge/set-mint-digest', params);

export const voteMint = (params: {
  userId: string;
  requestId: string;
  depositSignature: string;
}) => post<VoteMintResult>('/api/xbridge/vote-mint', params);

export const executeMint = (params: {
  userId: string;
  requestId: string;
  mintCapId: string;
  coinType?: string;
}) => post<ExecuteMintResult>('/api/xbridge/execute-mint', params);
