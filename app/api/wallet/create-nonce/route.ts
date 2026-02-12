import {
  address,
  appendTransactionMessageInstruction,
  type Base64EncodedWireTransaction,
  compileTransaction,
  createNoopSigner,
  createTransactionMessage,
  getBase64EncodedWireTransaction,
  pipe,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
} from '@solana/kit';
import {
  fetchMaybeNonce,
  getCreateAccountWithSeedInstruction,
  getInitializeNonceAccountInstruction,
  getNonceSize,
  NonceState,
  SYSTEM_PROGRAM_ADDRESS,
} from '@solana-program/system';
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
import { deriveNonceAddress, NONCE_SEED } from '@/lib/solana/nonce';
import { getSolanaRpc } from '@/lib/solana/server';

const TX_FEE_LAMPORTS = 5_000n;

const schema = z.object({
  userId: z.string(),
});

export const POST = withAuthPost(
  schema,
  async (body) => {
    try {
      const privy = getPrivyClient();
      const wallet = await getFirstWallet(privy, body.userId, 'solana');
      const rpc = getSolanaRpc();
      const walletAddress = address(wallet.address);
      const nonceAddress = await deriveNonceAddress(walletAddress);

      // Check if nonce account already exists and is initialized
      const existingNonce = await fetchMaybeNonce(rpc, nonceAddress);
      if (
        existingNonce.exists &&
        existingNonce.data.state === NonceState.Initialized
      ) {
        return NextResponse.json(
          {
            error: 'Nonce account already exists',
            nonceAddress: nonceAddress as string,
            code: 'NONCE_EXISTS',
          },
          { status: 409 }
        );
      }

      // Calculate rent exemption
      const nonceSize = BigInt(getNonceSize());
      const rentLamports = await rpc
        .getMinimumBalanceForRentExemption(nonceSize)
        .send();
      const requiredLamports = rentLamports + TX_FEE_LAMPORTS;

      // Check balance
      const balanceResult = await rpc
        .getBalance(walletAddress, { commitment: 'confirmed' })
        .send();
      const balance = balanceResult.value;

      if (balance < requiredLamports) {
        return NextResponse.json(
          {
            error: 'Insufficient SOL for nonce account creation',
            code: 'INSUFFICIENT_SOL',
            required: requiredLamports.toString(),
            balance: balance.toString(),
          },
          { status: 402 }
        );
      }

      const fromSigner = createNoopSigner(walletAddress);

      const createInstruction = getCreateAccountWithSeedInstruction({
        payer: fromSigner,
        newAccount: nonceAddress,
        base: walletAddress,
        seed: NONCE_SEED,
        amount: rentLamports,
        space: nonceSize,
        programAddress: SYSTEM_PROGRAM_ADDRESS,
      });

      const initInstruction = getInitializeNonceAccountInstruction({
        nonceAccount: nonceAddress,
        nonceAuthority: walletAddress,
      });

      let lastError: unknown;

      for (let attempt = 0; attempt < BLOCKHASH_RETRY_ATTEMPTS; attempt++) {
        try {
          const { value: latestBlockhash } = await rpc
            .getLatestBlockhash({ commitment: 'confirmed' })
            .send();

          const transactionMessage = pipe(
            createTransactionMessage({ version: 'legacy' }),
            (msg) => setTransactionMessageFeePayer(walletAddress, msg),
            (msg) =>
              setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, msg),
            (msg) =>
              appendTransactionMessageInstruction(createInstruction, msg),
            (msg) => appendTransactionMessageInstruction(initInstruction, msg)
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

          return NextResponse.json({
            signature,
            nonceAddress: nonceAddress as string,
          });
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
      return errorResponse(caught, 'Failed to create nonce account');
    }
  },
  { verifyUserId: true }
);
