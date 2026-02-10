import {
  Intent,
  WITNESS_TYPE,
  XBridgeInbound,
} from '@interest-protocol/xbridge-sdk';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { validateBody } from '@/lib/api/validate-params';
import { getPrivyClient } from '@/lib/privy/server';
import { signAndExecuteSuiTransaction } from '@/lib/privy/signing';
import { WalletNotFoundError, getFirstWallet } from '@/lib/privy/wallet';
import { ENCLAVE_OBJECT_ID, createXBridgeSdk } from '@/lib/xbridge';

const schema = z.object({
  userId: z.string(),
  requestId: z.string(),
  depositSignature: z.string(),
  rpcUrl: z.string().optional(),
});

export async function POST(request: NextRequest) {
  if (!process.env.ENCLAVE_URL)
    return NextResponse.json(
      { error: 'ENCLAVE_URL not configured' },
      { status: 500 }
    );

  const enclaveUrl = process.env.ENCLAVE_URL;

  const { data: body, error } = validateBody(await request.json(), schema);
  if (error) return error;

  try {
    const privy = getPrivyClient();
    const wallet = await getFirstWallet(privy, body.userId, 'sui');
    const { suiClient, xbridge } = createXBridgeSdk(body.rpcUrl);

    const enclaveResponse = await fetch(`${enclaveUrl}/xbridge/vote_mint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({
        request_id: Array.from(
          Uint8Array.from(Buffer.from(body.requestId.slice(2), 'hex'))
        ),
        deposit_digest: body.depositSignature,
        intent: Intent.Vote,
      }),
    });

    if (!enclaveResponse.ok) {
      const err = await enclaveResponse.text();
      throw new Error(`Enclave error: ${err}`);
    }

    const proofRaw = await enclaveResponse.json();
    const proof = XBridgeInbound.parseVoteMintProof(proofRaw);

    const tx = xbridge.voteMintRequest({
      requestId: body.requestId,
      enclaveId: ENCLAVE_OBJECT_ID,
      validatorType: WITNESS_TYPE,
      signature: proof.signature,
      timestampMs: proof.timestampMs,
    });

    tx.setSender(wallet.address);

    const rawBytes = await tx.build({ client: suiClient });

    const txResult = await signAndExecuteSuiTransaction(privy, {
      walletId: wallet.id,
      rawBytes,
      suiClient,
      options: { showEffects: true },
    });

    return NextResponse.json({ digest: txResult.digest });
  } catch (error: unknown) {
    if (error instanceof WalletNotFoundError)
      return NextResponse.json({ error: error.message }, { status: 404 });
    const message =
      error instanceof Error ? error.message : 'Failed to vote on mint request';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
