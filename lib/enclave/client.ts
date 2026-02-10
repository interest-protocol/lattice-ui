import {
  type ChainId,
  WalletKey,
  XSwap,
  type NewRequestProof,
} from '@interest-protocol/xswap-sdk';

export type { NewRequestProof };

export const fetchNewRequestProof = async (
  digest: string,
  chainId: ChainId
): Promise<NewRequestProof> => {
  const response = await fetch('/api/enclave/new-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ digest, chainId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch proof');
  }

  const raw = await response.json();

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
