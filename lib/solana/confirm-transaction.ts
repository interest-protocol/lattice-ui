import type { Signature } from '@solana/kit';

import { pollUntil } from '@/lib/poll-until';

import type { SolanaRpc } from './server';

export const confirmSolanaTransaction = async (
  rpc: SolanaRpc,
  signature: Signature,
  signal?: AbortSignal
): Promise<void> => {
  await pollUntil(
    async () => {
      const { value: statuses } = await rpc
        .getSignatureStatuses([signature])
        .send();

      const status = statuses[0];
      if (status?.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(status.err)}`);
      }

      if (
        status?.confirmationStatus === 'finalized' ||
        status?.confirmationStatus === 'confirmed'
      ) {
        return status;
      }

      return null;
    },
    { maxPolls: 30, intervalMs: 2_000, signal }
  );
};
