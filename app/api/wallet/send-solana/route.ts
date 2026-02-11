import {
  type Address,
  address,
  appendTransactionMessageInstruction,
  compileTransaction,
  createNoopSigner,
  createTransactionMessage,
  getBase64EncodedWireTransaction,
  type Instruction,
  pipe,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
} from '@solana/kit';
import { getTransferSolInstruction } from '@solana-program/system';
import { getTransferInstruction } from '@solana-program/token';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { errorResponse, validateBody } from '@/lib/api/validate-params';
import { getPrivyClient } from '@/lib/privy/server';
import { getFirstWallet, WalletNotFoundError } from '@/lib/privy/wallet';
import { getSolanaRpc } from '@/lib/solana/server';

const schema = z.object({
  userId: z.string(),
  recipient: z.string(),
  amount: z.string(),
  mint: z.string().optional(),
});

async function findAta(
  rpc: ReturnType<typeof getSolanaRpc>,
  mint: Address,
  owner: Address
): Promise<Address> {
  const { value: accounts } = await rpc
    .getTokenAccountsByOwner(
      owner,
      { mint },
      { encoding: 'jsonParsed', commitment: 'confirmed' }
    )
    .send();

  if (accounts.length > 0) {
    return accounts[0].pubkey;
  }

  throw new Error(`No token account found for mint ${mint}`);
}

export async function POST(request: NextRequest) {
  const { data: body, error } = validateBody(await request.json(), schema);
  if (error) return error;

  try {
    const privy = getPrivyClient();
    const wallet = await getFirstWallet(privy, body.userId, 'solana');
    const rpc = getSolanaRpc();
    const fromAddress = address(wallet.address);
    const toAddress = address(body.recipient);
    const fromSigner = createNoopSigner(fromAddress);

    let instruction: Instruction;

    if (!body.mint) {
      instruction = getTransferSolInstruction({
        source: fromSigner,
        destination: toAddress,
        amount: BigInt(body.amount),
      });
    } else {
      const mintAddress = address(body.mint);
      const fromTokenAccount = await findAta(rpc, mintAddress, fromAddress);
      const toTokenAccount = await findAta(rpc, mintAddress, toAddress);

      instruction = getTransferInstruction({
        source: fromTokenAccount,
        destination: toTokenAccount,
        authority: fromSigner,
        amount: BigInt(body.amount),
      });
    }

    const { value: latestBlockhash } = await rpc
      .getLatestBlockhash({ commitment: 'confirmed' })
      .send();

    const transactionMessage = pipe(
      createTransactionMessage({ version: 'legacy' }),
      (msg) => setTransactionMessageFeePayer(fromAddress, msg),
      (msg) =>
        setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, msg),
      (msg) => appendTransactionMessageInstruction(instruction, msg)
    );

    const compiledTransaction = compileTransaction(transactionMessage);
    const serialized = getBase64EncodedWireTransaction(compiledTransaction);

    const result = await privy
      .wallets()
      .solana()
      .signAndSendTransaction(wallet.id, {
        caip2: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        transaction: serialized,
      });

    return NextResponse.json({
      signature: result.hash,
    });
  } catch (error: unknown) {
    if (error instanceof WalletNotFoundError)
      return errorResponse(error, error.message, 404);
    return errorResponse(error, 'Failed to send transaction');
  }
}
