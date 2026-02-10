import type { Signature } from '@solana/kit';

import type { SolanaRpc } from './server';

export const confirmSolanaTransaction = async (
  rpc: SolanaRpc,
  signature: Signature
): Promise<void> => {
  // Poll for confirmation
  const maxRetries = 30;
  for (let i = 0; i < maxRetries; i++) {
    const { value: statuses } = await rpc
      .getSignatureStatuses([signature])
      .send();

    const status = statuses[0];
    if (
      status?.confirmationStatus === 'finalized' ||
      status?.confirmationStatus === 'confirmed'
    ) {
      return;
    }

    if (status?.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(status.err)}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error('Transaction confirmation timed out');
};
