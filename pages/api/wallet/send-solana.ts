import {
  createTransferInstruction,
  getAssociatedTokenAddress,
} from '@solana/spl-token';
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import type { NextApiHandler } from 'next';

import { getPrivyClient } from '@/lib/privy/server';
import { getSolanaConnection } from '@/lib/solana/server';

const handler: NextApiHandler = async (req, res) => {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const { userId, recipient, amount, mint } = req.body;

  if (!userId || typeof userId !== 'string')
    return res.status(400).json({ error: 'Missing userId' });
  if (!recipient || typeof recipient !== 'string')
    return res.status(400).json({ error: 'Missing recipient' });
  if (!amount || typeof amount !== 'string')
    return res.status(400).json({ error: 'Missing amount' });

  try {
    const privy = getPrivyClient();

    // Find the user's Solana wallet
    const wallets = [];
    for await (const wallet of privy.wallets().list({
      user_id: userId,
      chain_type: 'solana',
    })) {
      wallets.push(wallet);
    }

    if (wallets.length === 0)
      return res.status(404).json({ error: 'No Solana wallet found' });

    const wallet = wallets[0];
    const connection = getSolanaConnection();
    const fromPubkey = new PublicKey(wallet.address);
    const toPubkey = new PublicKey(recipient);

    const tx = new Transaction();

    if (!mint) {
      // Native SOL transfer (amount in lamports)
      tx.add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey,
          lamports: BigInt(amount),
        })
      );
    } else {
      // SPL token transfer (amount in smallest unit)
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

    return res.status(200).json({
      signature: (result as unknown as { signature: string }).signature,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to send transaction';
    return res.status(500).json({ error: message });
  }
};

export default handler;
