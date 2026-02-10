import { createSolanaRpc } from '@solana/kit';

import { SOLANA_RPC_URL } from '@/constants';

let cachedRpc: ReturnType<typeof createSolanaRpc> | null = null;

export type SolanaRpc = ReturnType<typeof createSolanaRpc>;

export const getSolanaRpc = (): SolanaRpc => {
  if (!cachedRpc) {
    cachedRpc = createSolanaRpc(SOLANA_RPC_URL);
  }

  return cachedRpc;
};
