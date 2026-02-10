import { Connection } from '@solana/web3.js';
import { useMemo } from 'react';

import { SOLANA_RPC_URL } from '@/constants';

const useSolanaConnection = () =>
  useMemo(() => new Connection(SOLANA_RPC_URL, 'confirmed'), []);

export default useSolanaConnection;
