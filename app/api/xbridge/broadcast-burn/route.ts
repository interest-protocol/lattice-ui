import type { Base64EncodedWireTransaction, Signature } from '@solana/kit';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { errorResponse } from '@/lib/api/validate-params';
import { withAuthPost } from '@/lib/api/with-auth';
import { confirmSolanaTransaction } from '@/lib/solana/confirm-transaction';
import { getSolanaRpc } from '@/lib/solana/server';
import { createXBridgeSdk } from '@/lib/xbridge';

const schema = z.object({
  userId: z.string(),
  requestId: z.string(),
  signId: z.string(),
  userSignature: z.string(),
  message: z.string(),
});

const MAX_POLLS = 40;
const POLL_INTERVAL_MS = 3_000;

export const POST = withAuthPost(
  schema,
  async (body) => {
    try {
      const { suiClient } = createXBridgeSdk();

      // === Step 1: Poll IKA sign completion ===
      let dwalletSignature: Uint8Array | null = null;

      for (let i = 0; i < MAX_POLLS; i++) {
        const obj = await suiClient.getObject({
          id: body.signId,
          options: { showContent: true },
        });

        const content = obj.data?.content;
        if (content?.dataType === 'moveObject') {
          const fields = content.fields as Record<string, unknown>;
          const state = fields?.state as Record<string, unknown> | undefined;

          if (state?.Completed) {
            const completed = state.Completed as {
              fields?: { signature?: number[] };
            };
            if (completed.fields?.signature) {
              dwalletSignature = new Uint8Array(completed.fields.signature);
              break;
            }
          }
        }

        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      }

      if (!dwalletSignature) {
        throw new Error(
          'IKA signing timed out — dWallet signature not available'
        );
      }

      // === Step 2: Build raw Solana transaction ===
      // Wire format: [num_sigs][sig0 64B][sig1 64B][message_bytes]
      // Two signers: position 0 = user (nonceAuthority), position 1 = dWallet (tokenOwner)
      const messageBytes = Buffer.from(body.message, 'hex');
      const userSig = Buffer.from(body.userSignature, 'hex');
      const dwalletSig = Buffer.from(dwalletSignature);

      const rawTx = Buffer.concat([
        Buffer.from([2]),
        userSig,
        dwalletSig,
        messageBytes,
      ]);
      const base64Tx = rawTx.toString('base64') as Base64EncodedWireTransaction;

      // === Step 3: Broadcast + confirm ===
      const rpc = getSolanaRpc();
      const signature = await rpc
        .sendTransaction(base64Tx, {
          encoding: 'base64',
          preflightCommitment: 'confirmed',
        })
        .send();

      await confirmSolanaTransaction(rpc, signature as Signature);

      return NextResponse.json({ solanaSignature: signature });
    } catch (caught: unknown) {
      return errorResponse(caught, 'Broadcast burn failed');
    }
  },
  { verifyUserId: true }
);
