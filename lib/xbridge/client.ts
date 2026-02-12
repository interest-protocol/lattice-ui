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
