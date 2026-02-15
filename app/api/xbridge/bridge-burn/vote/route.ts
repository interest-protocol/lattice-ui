import { toHex } from '@mysten/sui/utils';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { fetchWithRetry } from '@/lib/api/fetch-with-retry';
import { errorResponse } from '@/lib/api/validate-params';
import { withAuthPost } from '@/lib/api/with-auth';
import { ENCLAVE_API_KEY, ENCLAVE_URL } from '@/lib/config.server';
import { createXBridgeSdk } from '@/lib/xbridge';

const schema = z.object({
  userId: z.string(),
  requestId: z.string(),
  coinType: z.string(),
});

export const POST = withAuthPost(
  schema,
  async (body) => {
    const t0 = performance.now();
    const elapsed = () => ((performance.now() - t0) / 1000).toFixed(1);
    console.log(`[bridge-burn/vote] start requestId=${body.requestId}`);

    try {
      const { xbridge } = createXBridgeSdk();

      const burnRequestData = await xbridge.getBurnRequest({
        requestId: body.requestId,
      });
      console.log(`[bridge-burn/vote] getBurnRequest ok (${elapsed()}s)`);

      const result = await fetchWithRetry(`${ENCLAVE_URL}/xbridge/vote_burn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ENCLAVE_API_KEY,
        },
        signal: AbortSignal.timeout(10_000),
        body: JSON.stringify({
          request_id: body.requestId.replace(/^0x/, ''),
          chain_id: Number(burnRequestData.sourceChain),
          source_token: toHex(new Uint8Array(burnRequestData.sourceToken)),
          source_decimals: burnRequestData.sourceDecimals,
          destination_address: toHex(
            new Uint8Array(burnRequestData.destinationAddress)
          ),
          source_amount: burnRequestData.sourceAmount.toString(),
          message: toHex(new Uint8Array(burnRequestData.message)),
        }),
      }).then(
        (r) => r.json() as Promise<{ signature: string; timestamp_ms: number }>
      );

      console.log(
        `[bridge-burn/vote] enclave vote ok signature=${result.signature.slice(0, 16)}… timestampMs=${result.timestamp_ms} (${elapsed()}s)`
      );
      console.log(`[bridge-burn/vote] done in ${elapsed()}s`);

      return NextResponse.json({
        signature: result.signature,
        timestampMs: result.timestamp_ms,
      });
    } catch (caught: unknown) {
      console.error(`[bridge-burn/vote] error after ${elapsed()}s`, caught);
      return errorResponse(caught, 'Bridge burn vote failed');
    }
  },
  { verifyUserId: true }
);
