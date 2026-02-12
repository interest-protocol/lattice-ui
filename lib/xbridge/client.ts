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

export interface BridgeBurnResult {
  createDigest: string;
  executeDigest: string;
  requestId: string;
  signId: string;
  userSignature: string;
  message: string;
}

export const bridgeBurn = (params: {
  userId: string;
  sourceAmount: string;
  destinationAddress: number[];
  nonceAddress: string;
  coinType: string;
}) =>
  post<BridgeBurnResult>('/api/xbridge/bridge-burn', params, {
    timeout: 60_000,
    retries: 0,
  });

export interface BroadcastBurnResult {
  solanaSignature: string;
}

export const broadcastBurn = (params: {
  userId: string;
  requestId: string;
  signId: string;
  userSignature: string;
  message: string;
}) =>
  post<BroadcastBurnResult>('/api/xbridge/broadcast-burn', params, {
    timeout: 180_000,
    retries: 0,
  });
