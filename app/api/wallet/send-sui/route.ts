import { Transaction } from '@mysten/sui/transactions';
import { type NextRequest, NextResponse } from 'next/server';

import { getPrivyClient } from '@/lib/privy/server';
import { signAndExecuteSuiTransaction } from '@/lib/privy/signing';
import { WalletNotFoundError, getFirstWallet } from '@/lib/privy/wallet';
import { getSuiClient } from '@/lib/sui/client';

export async function POST(request: NextRequest) {
  const { userId, recipient, amount, coinType, rpcUrl } = await request.json();

  if (!userId || typeof userId !== 'string')
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  if (!recipient || typeof recipient !== 'string')
    return NextResponse.json({ error: 'Missing recipient' }, { status: 400 });
  if (!amount || typeof amount !== 'string')
    return NextResponse.json({ error: 'Missing amount' }, { status: 400 });

  try {
    const privy = getPrivyClient();
    const wallet = await getFirstWallet(privy, userId, 'sui');

    const client = getSuiClient(rpcUrl);

    const tx = new Transaction();
    tx.setSender(wallet.address);

    if (!coinType || coinType === '0x2::sui::SUI') {
      const [coin] = tx.splitCoins(tx.gas, [BigInt(amount)]);
      tx.transferObjects([coin], recipient);
    } else {
      const coins = await client.getCoins({
        owner: wallet.address,
        coinType,
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

      const [splitCoin] = tx.splitCoins(primaryCoin, [BigInt(amount)]);
      tx.transferObjects([splitCoin], recipient);
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
