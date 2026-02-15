import { XSWAP_TYPE } from '@interest-protocol/xswap-sdk';
import { Transaction } from '@mysten/sui/transactions';
import { fromHex } from '@mysten/sui/utils';
import { NextResponse } from 'next/server';
import invariant from 'tiny-invariant';
import { z } from 'zod';

import { errorResponse } from '@/lib/api/validate-params';
import { withAuthPost } from '@/lib/api/with-auth';
import { getPrivyClient } from '@/lib/privy/server';
import {
  extractPublicKey,
  signAndExecuteSuiTransaction,
} from '@/lib/privy/signing';
import { createXBridgeSdk, ENCLAVE_OBJECT_ID } from '@/lib/xbridge';

const schema = z.object({
  userId: z.string(),
  requestId: z.string(),
  burnCapId: z.string(),
  presignCapId: z.string(),
  coinType: z.string(),
  voteSignature: z.string(),
  voteTimestampMs: z.number(),
  solverSignature: z.string(),
  suiWalletId: z.string(),
});

export const POST = withAuthPost(
  schema,
  async (body) => {
    const t0 = performance.now();
    const elapsed = () => ((performance.now() - t0) / 1000).toFixed(1);
    console.log(`[bridge-burn/finalize] start requestId=${body.requestId}`);

    try {
      const privy = getPrivyClient();
      const suiWallet = await privy.wallets().get(body.suiWalletId);

      const { suiClient, xbridge } = createXBridgeSdk();

      invariant(
        suiWallet.public_key,
        `Wallet ${suiWallet.id} has no public key`
      );
      const publicKey = extractPublicKey(suiWallet.public_key);

      const walletAddress = suiWallet.address;

      // Tx2: combined PTB (vote + execute burn)
      const tx2 = new Transaction();
      tx2.setSender(walletAddress);

      xbridge.voteBurnRequest({
        tx: tx2,
        requestId: body.requestId,
        enclaveId: ENCLAVE_OBJECT_ID,
        validatorType: XSWAP_TYPE,
        signature: fromHex(body.voteSignature),
        timestampMs: BigInt(body.voteTimestampMs),
        coinType: body.coinType,
      });

      xbridge.executeBurnRequest({
        tx: tx2,
        requestId: body.requestId,
        burnCapId: body.burnCapId,
        presignCapId: body.presignCapId,
        messageCentralizedSignature: fromHex(body.solverSignature),
        coinType: body.coinType,
      });

      const rawBytes2 = await tx2.build({ client: suiClient });

      const tx2Result = await signAndExecuteSuiTransaction(privy, {
        walletId: suiWallet.id,
        rawBytes: rawBytes2,
        suiClient,
        publicKey,
        options: { showEffects: true },
      });

      console.log(
        `[bridge-burn/finalize] Tx2 executed digest=${tx2Result.digest} (${elapsed()}s)`
      );

      await suiClient.waitForTransaction({ digest: tx2Result.digest });
      const updatedRequest = await xbridge.getBurnRequest({
        requestId: body.requestId,
      });
      console.log(
        `[bridge-burn/finalize] signId=${updatedRequest.signId} done in ${elapsed()}s`
      );

      return NextResponse.json({
        executeDigest: tx2Result.digest,
        signId: updatedRequest.signId,
      });
    } catch (caught: unknown) {
      console.error(
        `[bridge-burn/finalize] error after ${elapsed()}s`,
        caught
      );

      return errorResponse(caught, 'Bridge burn finalize failed');
    }
  },
  { verifyUserId: true }
);
