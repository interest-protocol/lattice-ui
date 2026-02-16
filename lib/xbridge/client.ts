import { post } from '@/lib/api/client';

export interface BridgeMintResult {
  digest: string;
  requestId: string;
  mintCapId: string;
  createDigest: string;
}

export const bridgeMint = (params: {
  userId: string;
  sourceChain: number;
  sourceToken: number[];
  sourceDecimals: number;
  sourceAddress: number[];
  sourceAmount: string;
  coinType: string;
  depositSignature: string;
}) =>
  post<BridgeMintResult>('/api/xbridge/bridge-mint', params, {
    timeout: 30_000,
    retries: 0,
  });

export interface BridgeBurnCreateResult {
  createDigest: string;
  requestId: string;
  burnCapId: string;
  presignCapId: string;
  suiWalletId: string;
  userSignature: string;
  message: string;
}

export const bridgeBurnCreate = (params: {
  userId: string;
  sourceAmount: string;
  destinationAddress: number[];
  nonceAddress: string;
  coinType: string;
}) =>
  post<BridgeBurnCreateResult>('/api/xbridge/bridge-burn/create', params, {
    timeout: 30_000,
    retries: 0,
  });

export interface BridgeBurnVoteResult {
  signature: string;
  timestampMs: number;
}

export const bridgeBurnVote = (params: {
  userId: string;
  requestId: string;
  coinType: string;
}) =>
  post<BridgeBurnVoteResult>('/api/xbridge/bridge-burn/vote', params, {
    timeout: 20_000,
    retries: 0,
  });

export interface BridgeBurnSignResult {
  solverSignature: string;
}

export const bridgeBurnSign = (params: {
  userId: string;
  requestId: string;
  coinType: string;
  presignCapId: string;
}) =>
  post<BridgeBurnSignResult>('/api/xbridge/bridge-burn/sign', params, {
    timeout: 120_000,
    retries: 0,
  });

export interface BridgeBurnFinalizeResult {
  executeDigest: string;
  signId: string;
}

export const bridgeBurnFinalize = (params: {
  userId: string;
  requestId: string;
  burnCapId: string;
  presignCapId: string;
  coinType: string;
  voteSignature: string;
  voteTimestampMs: number;
  solverSignature: string;
}) =>
  post<BridgeBurnFinalizeResult>('/api/xbridge/bridge-burn/finalize', params, {
    timeout: 30_000,
    retries: 0,
  });
