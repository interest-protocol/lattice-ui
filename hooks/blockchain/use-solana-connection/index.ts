import { createSolanaRpc } from '@solana/kit';

import { SOLANA_RPC_URL } from '@/constants';

const useSolanaRpc = () => createSolanaRpc(SOLANA_RPC_URL);

export default useSolanaRpc;
