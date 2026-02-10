import { createSolanaRpc } from '@solana/kit';
import { useMemo } from 'react';

import { SOLANA_RPC_URL } from '@/constants';

const useSolanaRpc = () => useMemo(() => createSolanaRpc(SOLANA_RPC_URL), []);

export default useSolanaRpc;
