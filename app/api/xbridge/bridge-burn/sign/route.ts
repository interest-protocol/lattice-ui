import { ChainId, WalletKey } from '@interest-protocol/xbridge-sdk';
import { NextResponse } from 'next/server';
import invariant from 'tiny-invariant';
import { z } from 'zod';

import { createRouteLogger } from '@/lib/api/route-logger';
import { errorResponse } from '@/lib/api/validate-params';
import { withAuthPost } from '@/lib/api/with-auth';
import { pollUntil } from '@/lib/poll-until';
import { sign } from '@/lib/solver/server';
import { createXBridgeSdk } from '@/lib/xbridge';

const toHexNoPrefix = (bytes: Uint8Array): string =>
  Buffer.from(bytes).toString('hex');

const schema = z.object({
  userId: z.string(),
  requestId: z.string(),
  coinType: z.string(),
  presignCapId: z.string(),
});

export const POST = withAuthPost(
  schema,
  async (body) => {
    const log = createRouteLogger('bridge-burn/sign');
    log.start(`requestId=${body.requestId}`);

    try {
      const { suiClient, xbridge } = createXBridgeSdk();

      // Resolve the owner from the cap object itself (not from metadata)
      const capObj = await suiClient.getObject({
        id: body.presignCapId,
        options: { showOwner: true },
      });
      // biome-ignore lint/suspicious/noExplicitAny: SUI RPC owner shape
      const owner = (capObj.data?.owner as any)?.AddressOwner as
        | string
        | undefined;
      invariant(owner, 'Could not determine presign cap owner');

      // Poll until MPC completes the presign session for THIS specific cap.
      // getPresignCaps only returns caps whose session state is Completed
      // (i.e. presign bytes exist). We filter by presignCapId to avoid
      // matching stale caps from previous sessions.
      let pollAttempt = 0;
      const presignData = await pollUntil(
        () => {
          pollAttempt++;
          log.info(`presign poll attempt ${pollAttempt}/45`);
          return xbridge
            .getPresignCaps({
              owner,
              walletKey: WalletKey[ChainId.Solana],
            })
            .then(
              (caps) =>
                caps.find((c) => c.presignCapId === body.presignCapId) ?? null
            )
            .catch(() => null);
        },
        { maxPolls: 45, intervalMs: 2_000 }
      );
      log.info(
        `presign resolved for cap ${body.presignCapId} after ${pollAttempt} attempts`
      );

      // Fetch the burn request to get the native SOL transfer message bytes
      const burnRequestData = await xbridge.getBurnRequest({
        requestId: body.requestId,
      });
      invariant(
        burnRequestData.message.length === 224,
        `Invalid native SOL message length: ${burnRequestData.message.length}`
      );
      log.info('getBurnRequest ok');

      // Compute centralized signature through solver-api.
      // This follows core/solver-api's cached protocol-parameter strategy.
      log.info('computing centralized signature');

      const solverSignature = await sign({
        presign: toHexNoPrefix(new Uint8Array(presignData.presign)),
        message: toHexNoPrefix(new Uint8Array(burnRequestData.message)),
        chain: 'solana',
      });

      log.info('centralized signature computed');
      log.info('done');

      return NextResponse.json({
        solverSignature,
      });
    } catch (caught: unknown) {
      log.error('error', caught);

      return errorResponse(caught, 'Bridge burn sign failed');
    }
  },
  { verifyUserId: true }
);
