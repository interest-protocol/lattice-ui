import { createSolanaRpc } from '@solana/kit';

import { SOLANA_RPC_URL } from '@/constants';

const rpcCache = new Map<string, ReturnType<typeof createSolanaRpc>>();

const useSolanaRpc = () => {
  let rpc = rpcCache.get(SOLANA_RPC_URL);
  if (!rpc) {
    rpc = createSolanaRpc(SOLANA_RPC_URL);
    rpcCache.set(SOLANA_RPC_URL, rpc);
  }
  return rpc;
};

export default useSolanaRpc;
