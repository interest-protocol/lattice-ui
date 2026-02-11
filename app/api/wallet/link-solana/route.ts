import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { authenticateRequest, verifyUserMatch } from '@/lib/api/auth';
import { errorResponse, validateBody } from '@/lib/api/validate-params';
import { getPrivyClient } from '@/lib/privy/server';
import { signAndExecuteSuiTransaction } from '@/lib/privy/signing';
import { getFirstWallet, WalletNotFoundError } from '@/lib/privy/wallet';
import { createRegistrySdk, Registry, SolanaPubkey } from '@/lib/registry';

const schema = z.object({
  userId: z.string(),
});

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return auth;

  const { data: body, error } = validateBody(await request.json(), schema);
  if (error) return error;

  const mismatch = verifyUserMatch(auth.userId, body.userId);
  if (mismatch) return mismatch;

  try {
    const privy = getPrivyClient();
    const suiWallet = await getFirstWallet(privy, body.userId, 'sui');
    const solanaWallet = await getFirstWallet(privy, body.userId, 'solana');

    const { suiClient, registry } = createRegistrySdk();

    const messageBytes = Registry.createSolanaLinkMessage(suiWallet.address);
    const messageHex = Buffer.from(messageBytes).toString('hex');

    const solanaSignResult = await privy.wallets().rawSign(solanaWallet.id, {
      params: {
        bytes: messageHex,
        encoding: 'hex',
        hash_function: 'sha256' as const,
      },
    });

    const solanaSignature = Uint8Array.from(
      Buffer.from(solanaSignResult.signature, 'hex')
    );

    const solanaWalletInfo = await privy.wallets().get(solanaWallet.id);
    const solanaPubkeyBytes = Uint8Array.from(
      Buffer.from(solanaWalletInfo.public_key ?? '', 'base64')
    );

    const solanaPubkey = new SolanaPubkey(solanaPubkeyBytes);
    const tx = registry.linkSolana({
      solanaPubkey,
      signature: solanaSignature,
    });

    tx.setSender(suiWallet.address);

    const rawBytes = await tx.build({ client: suiClient });

    const result = await signAndExecuteSuiTransaction(privy, {
      walletId: suiWallet.id,
      rawBytes,
      suiClient,
    });

    return NextResponse.json({
      digest: result.digest,
      suiAddress: suiWallet.address,
      solanaAddress: solanaWallet.address,
    });
  } catch (error: unknown) {
    if (error instanceof WalletNotFoundError)
      return errorResponse(error, error.message, 404);
    return errorResponse(error, 'Failed to link Solana');
  }
}
