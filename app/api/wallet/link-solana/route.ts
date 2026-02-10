import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { validateBody } from '@/lib/api/validate-params';
import { getPrivyClient } from '@/lib/privy/server';
import { signAndExecuteSuiTransaction } from '@/lib/privy/signing';
import { WalletNotFoundError, getFirstWallet } from '@/lib/privy/wallet';
import { Registry, SolanaPubkey, createRegistrySdk } from '@/lib/registry';

const schema = z.object({
  userId: z.string(),
});

export async function POST(request: NextRequest) {
  const { data: body, error } = validateBody(await request.json(), schema);
  if (error) return error;

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
      return NextResponse.json({ error: error.message }, { status: 404 });
    const message =
      error instanceof Error ? error.message : 'Failed to link Solana';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
