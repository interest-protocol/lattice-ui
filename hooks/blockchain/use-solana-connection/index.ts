import { createSolanaRpc } from '@solana/kit';

import { SOLANA_RPC_URL } from '@/constants';

let cachedRpc: ReturnType<typeof createSolanaRpc> | null = null;

const useSolanaRpc = () => {
  if (!cachedRpc) {
    cachedRpc = createSolanaRpc(SOLANA_RPC_URL);
  }
  return cachedRpc;
};

export default useSolanaRpc;
