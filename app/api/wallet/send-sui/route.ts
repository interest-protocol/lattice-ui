import { Transaction } from '@mysten/sui/transactions';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { validateBody } from '@/lib/api/validate-params';
import { getPrivyClient } from '@/lib/privy/server';
import { signAndExecuteSuiTransaction } from '@/lib/privy/signing';
import { getFirstWallet, WalletNotFoundError } from '@/lib/privy/wallet';
import { getSuiClient } from '@/lib/sui/client';

const schema = z.object({
  userId: z.string(),
  recipient: z.string(),
  amount: z.string(),
  coinType: z.string().optional(),
  rpcUrl: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const { data: body, error } = validateBody(await request.json(), schema);
  if (error) return error;

  try {
    const privy = getPrivyClient();
    const wallet = await getFirstWallet(privy, body.userId, 'sui');

    const client = getSuiClient(body.rpcUrl);

    const tx = new Transaction();
    tx.setSender(wallet.address);

    if (!body.coinType || body.coinType === '0x2::sui::SUI') {
      const [coin] = tx.splitCoins(tx.gas, [BigInt(body.amount)]);
      tx.transferObjects([coin], body.recipient);
    } else {
      const coins = await client.getCoins({
        owner: wallet.address,
        coinType: body.coinType,
      });

      if (!coins.data.length)
        return NextResponse.json(
          { error: 'No coins of this type found' },
          { status: 400 }
        );

      const primaryCoin = tx.object(coins.data[0].coinObjectId);

      if (coins.data.length > 1) {
        tx.mergeCoins(
          primaryCoin,
          coins.data.slice(1).map((c) => tx.object(c.coinObjectId))
        );
      }

      const [splitCoin] = tx.splitCoins(primaryCoin, [BigInt(body.amount)]);
      tx.transferObjects([splitCoin], body.recipient);
    }

    const rawBytes = await tx.build({ client });

    const result = await signAndExecuteSuiTransaction(privy, {
      walletId: wallet.id,
      rawBytes,
      suiClient: client,
    });

    return NextResponse.json({ digest: result.digest });
  } catch (error: unknown) {
    if (error instanceof WalletNotFoundError)
      return NextResponse.json({ error: error.message }, { status: 404 });
    const message =
      error instanceof Error ? error.message : 'Failed to send transaction';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
