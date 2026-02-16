import { ChainId, WalletKey } from '@interest-protocol/xbridge-sdk';
import { NextResponse } from 'next/server';
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

      const capObj = await suiClient.getObject({
        id: body.presignCapId,
        options: { showOwner: true },
      });
      const owner = (capObj.data?.owner as any)?.AddressOwner as
        | string
        | undefined;
      if (!owner) {
        return NextResponse.json(
          { error: 'Could not determine presign cap owner' },
          { status: 400 }
        );
      }

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

      const burnRequestData = await xbridge.getBurnRequest({
        requestId: body.requestId,
      });
      if (burnRequestData.message.length !== 224) {
        return NextResponse.json(
          { error: `Invalid native SOL message length: ${burnRequestData.message.length}` },
          { status: 400 }
        );
      }
      log.info('getBurnRequest ok');

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
