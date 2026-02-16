import {
  Curve,
  getNetworkConfig,
  IkaClient,
  SignatureAlgorithm,
} from '@ika.xyz/sdk';
import type { SuiClient } from '@mysten/sui/client';
import { toHex } from '@mysten/sui/utils';
import { NextResponse } from 'next/server';
import invariant from 'tiny-invariant';
import { z } from 'zod';

import { createRouteLogger } from '@/lib/api/route-logger';
import { errorResponse } from '@/lib/api/validate-params';
import { withAuthPost } from '@/lib/api/with-auth';
import { createXBridgeSdk } from '@/lib/xbridge';

const schema = z.object({
  userId: z.string(),
  requestId: z.string(),
  signId: z.string(),
});

let cachedIkaClient: {
  client: IkaClient;
  suiClient: SuiClient;
} | null = null;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getIkaClient = async (suiClient: SuiClient): Promise<IkaClient> => {
  if (cachedIkaClient?.suiClient === suiClient) return cachedIkaClient.client;

  const client = new IkaClient({
    suiClient,
    config: getNetworkConfig('mainnet'),
  });
  await client.initialize();
  cachedIkaClient = { client, suiClient };

  return client;
};

const waitForSignature = async (args: {
  ikaClient: IkaClient;
  signId: string;
  timeoutMs: number;
  intervalMs: number;
}): Promise<Uint8Array> => {
  const start = Date.now();
  let lastError: unknown = null;

  while (Date.now() - start < args.timeoutMs) {
    try {
      const sign = await args.ikaClient.getSign(
        args.signId,
        Curve.ED25519,
        SignatureAlgorithm.EdDSA
      );

      const stateKind = sign.state.$kind;
      if (stateKind === 'Completed') {
        return new Uint8Array(sign.state.Completed.signature);
      }

      if (stateKind === 'NetworkRejected') {
        throw new Error(
          'IKA rejected sign request (invalid centralized signature or message)'
        );
      }
    } catch (caught) {
      lastError = caught;
      const message = caught instanceof Error ? caught.message : String(caught);
      const isRejected = /networkrejected|rejected sign request/i.test(message);
      if (isRejected) {
        throw caught;
      }
    }

    await sleep(args.intervalMs);
  }

  const reason =
    lastError instanceof Error
      ? ` Last error: ${lastError.message}`
      : lastError
        ? ` Last error: ${String(lastError)}`
        : '';
  throw new Error(`Timed out waiting for IKA signature completion.${reason}`);
};

export const POST = withAuthPost(
  schema,
  async (body) => {
    const log = createRouteLogger('bridge-burn/wait-signature');
    log.start(`requestId=${body.requestId} signId=${body.signId}`);

    try {
      const { suiClient, xbridge } = createXBridgeSdk();
      const burnRequest = await xbridge.getBurnRequest({
        requestId: body.requestId,
      });

      invariant(
        burnRequest.signId === body.signId,
        `Sign ID mismatch for burn request ${body.requestId}`
      );

      const ikaClient = await getIkaClient(suiClient);

      const signature = await waitForSignature({
        ikaClient,
        signId: body.signId,
        timeoutMs: 120_000,
        intervalMs: 3_000,
      });

      log.info(`completed (${signature.length} bytes)`);

      return NextResponse.json({
        dWalletSignature: toHex(signature),
      });
    } catch (caught: unknown) {
      log.error('error', caught);

      const message = caught instanceof Error ? caught.message : String(caught);
      if (/networkrejected|rejected sign request/i.test(message)) {
        return errorResponse(
          caught,
          'Bridge signature was rejected by the signing network',
          422
        );
      }

      if (/timed out waiting for ika signature/i.test(message)) {
        return errorResponse(
          caught,
          'Timed out waiting for bridge signature',
          504
        );
      }

      return errorResponse(caught, 'Bridge burn signature wait failed');
    }
  },
  { verifyUserId: true }
);
