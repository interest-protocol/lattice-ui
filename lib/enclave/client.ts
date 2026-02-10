import {
  type ChainId,
  type NewRequestProof,
  type NewRequestProofRaw,
  WalletKey,
  XSwap,
} from '@interest-protocol/xswap-sdk';

import { post } from '@/lib/api/client';

export type { NewRequestProof };

export const fetchNewRequestProof = async (
  digest: string,
  chainId: ChainId
): Promise<NewRequestProof> => {
  const raw = await post<NewRequestProofRaw>('/api/enclave/new-request', {
    digest,
    chainId,
  });
  return XSwap.parseNewRequestProof(raw);
};

export const getWalletKeyForChain = (
  chainId: typeof WalletKey extends Record<infer K, bigint> ? K : never
): bigint => {
  const key = WalletKey[chainId];

  if (key === undefined) {
    throw new Error(`No wallet key for chain ${chainId}`);
  }

  return key;
};
