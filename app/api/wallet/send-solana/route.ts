import {
  type Address,
  address,
  appendTransactionMessageInstruction,
  type Base64EncodedWireTransaction,
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
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { errorResponse } from '@/lib/api/validate-params';
import { withAuthPost } from '@/lib/api/with-auth';
import { PRIVY_AUTHORIZATION_KEY } from '@/lib/config.server';
import { getPrivyClient } from '@/lib/privy/server';
import { getFirstWallet, WalletNotFoundError } from '@/lib/privy/wallet';
import {
  BLOCKHASH_RETRY_ATTEMPTS,
  BLOCKHASH_RETRY_DELAY_MS,
  isBlockhashError,
} from '@/lib/solana/blockhash-retry';
import { getSolanaRpc } from '@/lib/solana/server';

const schema = z.object({
  userId: z.string(),
  recipient: z
    .string()
    .regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, 'Invalid Solana address'),
  amount: z
    .string()
    .regex(/^\d+$/, 'Amount must be a non-negative integer string'),
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

export const POST = withAuthPost(
  schema,
  async (body) => {
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

      let lastError: unknown;

      for (let attempt = 0; attempt < BLOCKHASH_RETRY_ATTEMPTS; attempt++) {
        try {
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
          const serialized =
            getBase64EncodedWireTransaction(compiledTransaction);

          const signResult = await privy
            .wallets()
            .solana()
            .signTransaction(wallet.id, {
              transaction: serialized,
              authorization_context: {
                authorization_private_keys: [PRIVY_AUTHORIZATION_KEY],
              },
            });

          const signature = await rpc
            .sendTransaction(
              signResult.signed_transaction as Base64EncodedWireTransaction,
              { encoding: 'base64', preflightCommitment: 'confirmed' }
            )
            .send();

          return NextResponse.json({ signature });
        } catch (err) {
          lastError = err;
          if (
            !isBlockhashError(err) ||
            attempt === BLOCKHASH_RETRY_ATTEMPTS - 1
          )
            throw err;
          await new Promise((r) => setTimeout(r, BLOCKHASH_RETRY_DELAY_MS));
        }
      }

      throw lastError;
    } catch (caught: unknown) {
      if (caught instanceof WalletNotFoundError)
        return errorResponse(caught, caught.message, 404);
      return errorResponse(caught, 'Failed to send transaction');
    }
  },
  { verifyUserId: true }
);
