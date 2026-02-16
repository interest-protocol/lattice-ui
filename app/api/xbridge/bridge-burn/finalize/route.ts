import { XSWAP_TYPE } from '@interest-protocol/xswap-sdk';
import { Transaction } from '@mysten/sui/transactions';
import { fromHex } from '@mysten/sui/utils';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createRouteLogger } from '@/lib/api/route-logger';
import { errorResponse } from '@/lib/api/validate-params';
import { withAuthPost } from '@/lib/api/with-auth';
import { getPrivyClient } from '@/lib/privy/server';
import {
  getWalletPublicKey,
  signAndExecuteSuiTransaction,
} from '@/lib/privy/signing';
import { getFirstWallet, WalletNotFoundError } from '@/lib/privy/wallet';
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
});

export const POST = withAuthPost(
  schema,
  async (body) => {
    const log = createRouteLogger('bridge-burn/finalize');
    log.start(`requestId=${body.requestId}`);

    try {
      const privy = getPrivyClient();
      const suiWallet = await getFirstWallet(privy, body.userId, 'sui');

      const { suiClient, xbridge } = createXBridgeSdk();

      const publicKey = await getWalletPublicKey(privy, suiWallet.id);

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

      log.info(`Tx2 executed digest=${tx2Result.digest}`);

      await suiClient.waitForTransaction({ digest: tx2Result.digest });
      const updatedRequest = await xbridge.getBurnRequest({
        requestId: body.requestId,
      });
      log.info(`signId=${updatedRequest.signId} done`);

      return NextResponse.json({
        executeDigest: tx2Result.digest,
        signId: updatedRequest.signId,
      });
    } catch (caught: unknown) {
      log.error('error', caught);

      if (caught instanceof WalletNotFoundError)
        return errorResponse(caught, caught.message, 404);
      return errorResponse(caught, 'Bridge burn finalize failed');
    }
  },
  { verifyUserId: true }
);
