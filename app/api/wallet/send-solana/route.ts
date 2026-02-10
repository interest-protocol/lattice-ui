import {
  createTransferInstruction,
  getAssociatedTokenAddress,
} from '@solana/spl-token';
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { validateBody } from '@/lib/api/validate-params';
import { getPrivyClient } from '@/lib/privy/server';
import { WalletNotFoundError, getFirstWallet } from '@/lib/privy/wallet';
import { getSolanaConnection } from '@/lib/solana/server';

const schema = z.object({
  userId: z.string(),
  recipient: z.string(),
  amount: z.string(),
  mint: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const { data: body, error } = validateBody(await request.json(), schema);
  if (error) return error;

  try {
    const privy = getPrivyClient();
    const wallet = await getFirstWallet(privy, body.userId, 'solana');
    const connection = getSolanaConnection();
    const fromPubkey = new PublicKey(wallet.address);
    const toPubkey = new PublicKey(body.recipient);

    const tx = new Transaction();

    if (!body.mint) {
      tx.add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey,
          lamports: BigInt(body.amount),
        })
      );
    } else {
      const mintPubkey = new PublicKey(body.mint);
      const fromTokenAccount = await getAssociatedTokenAddress(
        mintPubkey,
        fromPubkey
      );
      const toTokenAccount = await getAssociatedTokenAddress(
        mintPubkey,
        toPubkey
      );
      tx.add(
        createTransferInstruction(
          fromTokenAccount,
          toTokenAccount,
          fromPubkey,
          BigInt(body.amount)
        )
      );
    }

    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = fromPubkey;

    const serialized = tx
      .serialize({ requireAllSignatures: false })
      .toString('base64');

    const result = await privy
      .wallets()
      .solana()
      .signAndSendTransaction(wallet.id, {
        caip2: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        transaction: serialized,
      });

    return NextResponse.json({
      signature: (result as unknown as { signature: string }).signature,
    });
  } catch (error: unknown) {
    if (error instanceof WalletNotFoundError)
      return NextResponse.json({ error: error.message }, { status: 404 });
    const message =
      error instanceof Error ? error.message : 'Failed to send transaction';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
