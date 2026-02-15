import {
  ChainId,
  WalletKey,
  WITNESS_TYPE,
} from '@interest-protocol/xbridge-sdk';
import { toHex } from '@mysten/sui/utils';
import { NextResponse } from 'next/server';
import invariant from 'tiny-invariant';
import { z } from 'zod';

import { errorResponse } from '@/lib/api/validate-params';
import { withAuthPost } from '@/lib/api/with-auth';
import { SOLVER_API_URL } from '@/lib/config';
import { SOLVER_API_KEY } from '@/lib/config.server';
import { pollUntil } from '@/lib/poll-until';
import { createXBridgeSdk } from '@/lib/xbridge';

const schema = z.object({
  userId: z.string(),
  requestId: z.string(),
  coinType: z.string(),
  presignCapId: z.string(),
});

export const POST = withAuthPost(
  schema,
  async (body) => {
    const t0 = performance.now();
    const elapsed = () => ((performance.now() - t0) / 1000).toFixed(1);
    console.log(`[bridge-burn/sign] start requestId=${body.requestId}`);

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
          console.log(
            `[bridge-burn/sign] presign poll attempt ${pollAttempt}/45 (${elapsed()}s)`
          );
          return xbridge
            .getPresignCaps({
              owner,
              walletKey: WalletKey[ChainId.Solana],
              appTypeName: WITNESS_TYPE,
            })
            .then(
              (caps) =>
                caps.find((c) => c.presignCapId === body.presignCapId) ?? null
            )
            .catch(() => null);
        },
        { maxPolls: 45, intervalMs: 2_000 }
      );
      console.log(
        `[bridge-burn/sign] presign resolved for cap ${body.presignCapId} after ${pollAttempt} attempts (${elapsed()}s)`
      );

      // Fetch the burn request to get the SPL transfer message bytes
      const burnRequestData = await xbridge.getBurnRequest({
        requestId: body.requestId,
      });
      console.log(`[bridge-burn/sign] getBurnRequest ok (${elapsed()}s)`);

      console.log(`[bridge-burn/sign] calling solver sign (${elapsed()}s)`);
      const solverResponse = await fetch(`${SOLVER_API_URL}/api/v1/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': SOLVER_API_KEY,
        },
        signal: AbortSignal.timeout(30_000),
        body: JSON.stringify({
          presign: toHex(new Uint8Array(presignData.presign)).replace(/^0x/, ''),
          message: toHex(new Uint8Array(burnRequestData.message)).replace(/^0x/, ''),
          chain: 'solana',
        }),
      });

      if (!solverResponse.ok) {
        const errorText = await solverResponse
          .text()
          .catch(() => 'Unknown error');
        throw new Error(`Solver sign failed: ${errorText}`);
      }

      const solverResult = (await solverResponse.json()) as {
        success: boolean;
        data: { signature: string };
      };

      console.log(`[bridge-burn/sign] solver sign ok (${elapsed()}s)`);
      console.log(`[bridge-burn/sign] done in ${elapsed()}s`);

      return NextResponse.json({
        solverSignature: solverResult.data.signature,
      });
    } catch (caught: unknown) {
      console.error(`[bridge-burn/sign] error after ${elapsed()}s`, caught);

      return errorResponse(caught, 'Bridge burn sign failed');
    }
  },
  { verifyUserId: true }
);
