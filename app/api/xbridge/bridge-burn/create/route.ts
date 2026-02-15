import { ChainId, DWalletAddress } from '@interest-protocol/xbridge-sdk';
import { coinWithBalance, Transaction } from '@mysten/sui/transactions';
import { fromBase64, toBase64, toHex } from '@mysten/sui/utils';
import { address } from '@solana/kit';
import { fetchMaybeNonce } from '@solana-program/system';
import {
  findAssociatedTokenPda,
  TOKEN_PROGRAM_ADDRESS,
} from '@solana-program/token';
import bs58 from 'bs58';
import { NextResponse } from 'next/server';
import invariant from 'tiny-invariant';
import { z } from 'zod';

import { WSOL_SUI_TYPE } from '@/constants/bridged-tokens';
import { NATIVE_SOL_MINT, SOL_DECIMALS } from '@/constants/coins';
import { errorResponse } from '@/lib/api/validate-params';
import { withAuthPost } from '@/lib/api/with-auth';
import { PRIVY_AUTHORIZATION_KEY } from '@/lib/config.server';
import { getPrivyClient } from '@/lib/privy/server';
import {
  extractPublicKey,
  signAndExecuteSuiTransaction,
} from '@/lib/privy/signing';
import { getFirstWallet, WalletNotFoundError } from '@/lib/privy/wallet';
import { getSolanaRpc } from '@/lib/solana/server';
import { buildSplTransfer } from '@/lib/solana/spl-message';
import { findCreatedObjectId } from '@/lib/sui/object-changes';
import { createXBridgeSdk } from '@/lib/xbridge';

const schema = z.object({
  userId: z.string(),
  sourceAmount: z.string().regex(/^\d+$/, 'Must be a non-negative integer'),
  destinationAddress: z.array(z.number()),
  nonceAddress: z.string(),
  coinType: z.string(),
});

export const POST = withAuthPost(
  schema,
  async (body) => {
    const t0 = performance.now();
    const elapsed = () => ((performance.now() - t0) / 1000).toFixed(1);
    console.log(
      `[bridge-burn/create] start sourceAmount=${body.sourceAmount} coinType=${body.coinType}`
    );

    try {
      const privy = getPrivyClient();

      // === Phase 0: Setup ===
      const [suiWallet, solanaWallet] = await Promise.all([
        getFirstWallet(privy, body.userId, 'sui'),
        getFirstWallet(privy, body.userId, 'solana'),
      ]);

      const { suiClient, xbridge } = createXBridgeSdk();

      const walletInfo = await privy.wallets().get(suiWallet.id);
      invariant(
        walletInfo.public_key,
        `Wallet ${suiWallet.id} has no public key`
      );
      const publicKey = extractPublicKey(walletInfo.public_key);

      const walletAddress = suiWallet.address;
      const userSolanaAddress = solanaWallet.address;
      console.log(`[bridge-burn/create] Phase 0 setup done (${elapsed()}s)`);

      // === Phase 1: Build SPL message + user pre-sign ===
      const dwalletSolana = DWalletAddress[ChainId.Solana];
      const nativeSolMint = address(NATIVE_SOL_MINT);

      // Derive ATAs
      const [sourceAtaPda, destinationAtaPda] = await Promise.all([
        findAssociatedTokenPda({
          owner: address(dwalletSolana),
          mint: nativeSolMint,
          tokenProgram: TOKEN_PROGRAM_ADDRESS,
        }),
        findAssociatedTokenPda({
          owner: address(userSolanaAddress),
          mint: nativeSolMint,
          tokenProgram: TOKEN_PROGRAM_ADDRESS,
        }),
      ]);

      const sourceAtaAddress = sourceAtaPda[0];
      const destinationAtaAddress = destinationAtaPda[0];

      // Fetch nonce value from Solana RPC
      const rpc = getSolanaRpc();
      const nonceResult = await fetchMaybeNonce(
        rpc,
        address(body.nonceAddress)
      );
      invariant(nonceResult.exists, 'Nonce account not found');
      const nonceValue = nonceResult.data.blockhash;
      const nonceBytes = bs58.decode(nonceValue as string);

      // Build SPL transfer message
      const tokenOwnerBytes = bs58.decode(dwalletSolana);
      const sourceAtaBytes = bs58.decode(sourceAtaAddress as string);
      const destinationAtaBytes = bs58.decode(destinationAtaAddress as string);
      const mintBytes = bs58.decode(NATIVE_SOL_MINT);
      const nonceAccountBytes = bs58.decode(body.nonceAddress);
      const userSolanaBytes = bs58.decode(userSolanaAddress);
      const destinationWalletBytes = new Uint8Array(body.destinationAddress);

      const messageBytes = buildSplTransfer({
        tokenOwner: tokenOwnerBytes,
        sourceAta: sourceAtaBytes,
        mint: mintBytes,
        decimals: SOL_DECIMALS,
        nonce: nonceBytes,
        nonceAccount: nonceAccountBytes,
        nonceAuthority: userSolanaBytes,
        destinationWallet: destinationWalletBytes,
        destinationAta: destinationAtaBytes,
        amount: BigInt(body.sourceAmount),
      });

      // Sign as Solana transaction (not signMessage — message signing adds a prefix
      // that invalidates the signature for on-chain transaction verification)
      const wireTx = Buffer.concat([
        Buffer.from([2]), // compact-u16: 2 signatures
        Buffer.alloc(64), // placeholder for user sig (position 0: nonceAuthority)
        Buffer.alloc(64), // placeholder for dWallet sig (position 1: tokenOwner)
        messageBytes,
      ]);

      const signResult = await privy
        .wallets()
        .solana()
        .signTransaction(solanaWallet.id, {
          transaction: toBase64(wireTx),
          authorization_context: {
            authorization_private_keys: [PRIVY_AUTHORIZATION_KEY],
          },
        });

      // Extract user's 64-byte Ed25519 signature from position 0 of signed wire tx
      const signedTxBytes = fromBase64(signResult.signed_transaction);
      const userSolanaSignature = signedTxBytes.subarray(1, 65);

      console.log(
        `[bridge-burn/create] Phase 1 SPL message + presign done (${elapsed()}s)`
      );

      // === Phase 2: Tx1 (create burn request + mint presign) ===
      const tx1 = new Transaction();
      tx1.setSender(walletAddress);

      const burnCoin = tx1.add(
        coinWithBalance({
          type: WSOL_SUI_TYPE,
          balance: BigInt(body.sourceAmount),
        })
      );
      const feeCoin = tx1.splitCoins(tx1.gas, [tx1.pure.u64(0)]);

      const {
        result: burnRequest,
        burnCap,
        refund,
      } = xbridge.newBurnRequest({
        tx: tx1,
        sourceChain: ChainId.Solana,
        sourceToken: bs58.decode(NATIVE_SOL_MINT),
        sourceDecimals: SOL_DECIMALS,
        destinationAddress: new Uint8Array(body.destinationAddress),
        sourceAmount: BigInt(body.sourceAmount),
        dwalletAddress: bs58.decode(dwalletSolana),
        message: messageBytes,
        nonce: nonceBytes,
        nonceAccount: nonceAccountBytes,
        destinationWallet: destinationWalletBytes,
        destinationAta: destinationAtaBytes,
        burnCoin,
        fee: feeCoin,
        coinType: body.coinType,
      });

      xbridge.shareBurnRequest({
        tx: tx1,
        request: burnRequest,
        coinType: body.coinType,
      });
      tx1.transferObjects([burnCap], walletAddress);
      tx1.transferObjects([refund], walletAddress);

      xbridge.mintPresign({
        tx: tx1,
        chainId: ChainId.Solana,
      });

      const rawBytes1 = await tx1.build({ client: suiClient });

      const tx1Result = await signAndExecuteSuiTransaction(privy, {
        walletId: suiWallet.id,
        rawBytes: rawBytes1,
        suiClient,
        publicKey,
        options: { showObjectChanges: true },
      });

      const requestId = findCreatedObjectId(
        tx1Result.objectChanges,
        'BurnRequest'
      );
      const burnCapId = findCreatedObjectId(tx1Result.objectChanges, 'BurnCap');
      const presignCapId = findCreatedObjectId(
        tx1Result.objectChanges,
        'PresignCap'
      );

      invariant(
        requestId && burnCapId && presignCapId,
        'Failed to extract requestId, burnCapId, or presignCapId from tx1'
      );
      console.log(
        `[bridge-burn/create] Phase 2 Tx1 done requestId=${requestId} burnCapId=${burnCapId} presignCapId=${presignCapId} digest=${tx1Result.digest} (${elapsed()}s)`
      );

      await suiClient.waitForTransaction({ digest: tx1Result.digest });
      console.log(`[bridge-burn/create] done in ${elapsed()}s`);

      return NextResponse.json({
        createDigest: tx1Result.digest,
        requestId,
        burnCapId,
        presignCapId,
        suiWalletId: suiWallet.id,
        userSignature: toHex(userSolanaSignature),
        message: toHex(messageBytes),
      });
    } catch (caught: unknown) {
      console.error(`[bridge-burn/create] error after ${elapsed()}s`, caught);

      if (caught instanceof WalletNotFoundError)
        return errorResponse(caught, caught.message, 404);

      return errorResponse(caught, 'Bridge burn create failed');
    }
  },
  { verifyUserId: true }
);
