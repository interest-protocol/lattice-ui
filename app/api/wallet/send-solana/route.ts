import {
  createTransferInstruction,
  getAssociatedTokenAddress,
} from '@solana/spl-token';
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { type NextRequest, NextResponse } from 'next/server';

import { getPrivyClient } from '@/lib/privy/server';
import { WalletNotFoundError, getFirstWallet } from '@/lib/privy/wallet';
import { getSolanaConnection } from '@/lib/solana/server';

export async function POST(request: NextRequest) {
  const { userId, recipient, amount, mint } = await request.json();

  if (!userId || typeof userId !== 'string')
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  if (!recipient || typeof recipient !== 'string')
    return NextResponse.json({ error: 'Missing recipient' }, { status: 400 });
  if (!amount || typeof amount !== 'string')
    return NextResponse.json({ error: 'Missing amount' }, { status: 400 });

  try {
    const privy = getPrivyClient();
    const wallet = await getFirstWallet(privy, userId, 'solana');
    const connection = getSolanaConnection();
    const fromPubkey = new PublicKey(wallet.address);
    const toPubkey = new PublicKey(recipient);

    const tx = new Transaction();

    if (!mint) {
      tx.add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey,
          lamports: BigInt(amount),
        })
      );
    } else {
      const mintPubkey = new PublicKey(mint);
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
          BigInt(amount)
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
