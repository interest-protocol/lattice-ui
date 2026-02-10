import type { Connection } from '@solana/web3.js';

export const confirmSolanaTransaction = async (
  connection: Connection,
  signature: string
): Promise<void> => {
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash('finalized');
  await connection.confirmTransaction({
    signature,
    blockhash,
    lastValidBlockHeight,
  });
};
