import { toHex } from '@mysten/sui/utils';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createRouteLogger } from '@/lib/api/route-logger';
import { errorResponse } from '@/lib/api/validate-params';
import { withAuthPost } from '@/lib/api/with-auth';
import { voteBurn } from '@/lib/enclave/server';
import { createXBridgeSdk } from '@/lib/xbridge';
import { withRetry } from '@/utils/with-retry';

const schema = z.object({
  userId: z.string(),
  requestId: z.string(),
  coinType: z.string(),
});

export const POST = withAuthPost(
  schema,
  async (body) => {
    const log = createRouteLogger('bridge-burn/vote');
    log.start(`requestId=${body.requestId}`);

    try {
      const { xbridge } = createXBridgeSdk();

      const burnRequestData = await withRetry(
        () => xbridge.getBurnRequest({ requestId: body.requestId }),
        3,
        500,
      );
      log.info('getBurnRequest ok');

      const result = await voteBurn({
        request_id: body.requestId.replace(/^0x/, ''),
        chain_id: Number(burnRequestData.sourceChain),
        source_token: toHex(new Uint8Array(burnRequestData.sourceToken)),
        source_decimals: burnRequestData.sourceDecimals,
        destination_address: toHex(
          new Uint8Array(burnRequestData.destinationAddress)
        ),
        source_amount: burnRequestData.sourceAmount.toString(),
        message: toHex(new Uint8Array(burnRequestData.message)),
      });

      log.info(
        `enclave vote ok signature=${result.signature.slice(0, 16)}… timestampMs=${result.timestamp_ms}`
      );
      log.info('done');

      return NextResponse.json({
        signature: result.signature,
        timestampMs: result.timestamp_ms,
      });
    } catch (caught: unknown) {
      log.error('error', caught);
      return errorResponse(caught, 'Bridge burn vote failed');
    }
  },
  { verifyUserId: true }
);
