import {
  ChainId,
  XBridgeInbound,
  XBridgeOutbound,
} from '@interest-protocol/xbridge-sdk';

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
  const response = await fetch('/api/xbridge/vote-mint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestId, depositDigest }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch vote mint proof');
  }

  const raw = await response.json();
  return XBridgeInbound.parseVoteMintProof(raw);
};

export const fetchVoteBurnProof = async (
  requestId: string
): Promise<VoteBurnProof> => {
  const response = await fetch('/api/xbridge/vote-burn', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch vote burn proof');
  }

  const raw = await response.json();
  return XBridgeInbound.parseVoteBurnProof(raw);
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

export const createMintRequest = async (params: {
  userId: string;
  sourceChain: number;
  sourceToken: number[];
  sourceDecimals: number;
  sourceAddress: number[];
  sourceAmount: string;
  coinType: string;
  rpcUrl?: string;
}): Promise<CreateMintRequestResult> => {
  const response = await fetch('/api/xbridge/create-mint-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create mint request');
  }

  return response.json();
};

export const setMintDigest = async (params: {
  userId: string;
  requestId: string;
  mintCapId: string;
  depositSignature: string;
  rpcUrl?: string;
}): Promise<SetMintDigestResult> => {
  const response = await fetch('/api/xbridge/set-mint-digest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to set mint digest');
  }

  return response.json();
};

export const voteMint = async (params: {
  userId: string;
  requestId: string;
  depositSignature: string;
  rpcUrl?: string;
}): Promise<VoteMintResult> => {
  const response = await fetch('/api/xbridge/vote-mint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to vote on mint request');
  }

  return response.json();
};

export const executeMint = async (params: {
  userId: string;
  requestId: string;
  mintCapId: string;
  coinType?: string;
  rpcUrl?: string;
}): Promise<ExecuteMintResult> => {
  const response = await fetch('/api/xbridge/execute-mint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to execute mint');
  }

  return response.json();
};
