import {
  ChainId,
  DWalletAddress,
  WalletKey,
  WITNESS_TYPE,
} from '@interest-protocol/xbridge-sdk';
import { XSWAP_TYPE } from '@interest-protocol/xswap-sdk';
import { coinWithBalance, Transaction } from '@mysten/sui/transactions';
import { fromBase64, fromHex, toBase64, toHex } from '@mysten/sui/utils';
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
import { fetchWithRetry } from '@/lib/api/fetch-with-retry';
import { errorResponse } from '@/lib/api/validate-params';
import { withAuthPost } from '@/lib/api/with-auth';
import { SOLVER_API_URL } from '@/lib/config';
import {
  ENCLAVE_API_KEY,
  ENCLAVE_URL,
  PRIVY_AUTHORIZATION_KEY,
  SOLVER_API_KEY,
} from '@/lib/config.server';
import { getPrivyClient } from '@/lib/privy/server';
import {
  extractPublicKey,
  signAndExecuteSuiTransaction,
} from '@/lib/privy/signing';
import { getFirstWallet, WalletNotFoundError } from '@/lib/privy/wallet';
import { getSolanaRpc } from '@/lib/solana/server';
import { buildSplTransfer } from '@/lib/solana/spl-message';
import { findCreatedObjectId } from '@/lib/sui/object-changes';
import { createXBridgeSdk, ENCLAVE_OBJECT_ID } from '@/lib/xbridge';

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
    let requestId: string | null = null;
    let burnCapId: string | null = null;
    let presignCapId: string | null = null;

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

      // === Phase 2: Tx1 (create burn request) ===
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
        nonceAuthority: userSolanaBytes,
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

      const presignFee = tx1.splitCoins(tx1.gas, [tx1.pure.u64(0)]);
      const { result: presignCap } = xbridge.mintPresign({
        tx: tx1,
        chainId: ChainId.Solana,
        fee: presignFee,
      });
      tx1.transferObjects(
        [presignCap as Parameters<typeof tx1.transferObjects>[0][0]],
        walletAddress
      );

      const rawBytes1 = await tx1.build({ client: suiClient });

      const tx1Result = await signAndExecuteSuiTransaction(privy, {
        walletId: suiWallet.id,
        rawBytes: rawBytes1,
        suiClient,
        publicKey,
        options: { showObjectChanges: true },
      });

      requestId = findCreatedObjectId(tx1Result.objectChanges, 'BurnRequest');
      burnCapId = findCreatedObjectId(tx1Result.objectChanges, 'BurnCap');
      presignCapId = findCreatedObjectId(
        tx1Result.objectChanges,
        'PresignCap'
      );

      invariant(
        requestId && burnCapId && presignCapId,
        'Failed to extract requestId, burnCapId, or presignCapId from tx1'
      );

      await suiClient.waitForTransaction({ digest: tx1Result.digest });

      // === Phase 3: Enclave vote + Solver sign (parallel) ===
      const [burnRequestData, presignData] = await Promise.all([
        xbridge.getBurnRequest({ requestId }),
        xbridge.getFirstPresign({
          owner: walletAddress,
          walletKey: WalletKey[ChainId.Solana],
          appTypeName: WITNESS_TYPE,
        }),
      ]);

      const [voteData, solverResult] = await Promise.all([
        // Enclave vote
        fetchWithRetry(`${ENCLAVE_URL}/xbridge/vote_burn`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ENCLAVE_API_KEY,
          },
          signal: AbortSignal.timeout(10_000),
          body: JSON.stringify({
            request_id: requestId.replace(/^0x/, ''),
            chain_id: Number(burnRequestData.sourceChain),
            source_token: toHex(new Uint8Array(burnRequestData.sourceToken)),
            source_decimals: burnRequestData.sourceDecimals,
            destination_address: toHex(
              new Uint8Array(burnRequestData.destinationAddress)
            ),
            source_amount: burnRequestData.sourceAmount.toString(),
            message: toHex(new Uint8Array(burnRequestData.message)),
          }),
        }).then(
          (r) =>
            r.json() as Promise<{ signature: string; timestamp_ms: number }>
        ),
        // Solver sign (presign data already resolved)
        fetch(`${SOLVER_API_URL}/api/v1/sign`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': SOLVER_API_KEY,
          },
          signal: AbortSignal.timeout(30_000),
          body: JSON.stringify({
            presign: toHex(new Uint8Array(presignData.presign)),
            message: toHex(new Uint8Array(burnRequestData.message)),
            chain: 'solana',
          }),
        }).then(async (solverResponse) => {
          if (!solverResponse.ok) {
            const errorText = await solverResponse
              .text()
              .catch(() => 'Unknown error');
            throw new Error(`Solver sign failed: ${errorText}`);
          }
          return solverResponse.json() as Promise<{
            success: boolean;
            data: { signature: string };
          }>;
        }),
      ]);

      const messageCentralizedSignature = fromHex(solverResult.data.signature);

      // === Phase 4: Tx2 (combined PTB: vote + execute) ===
      const tx2 = new Transaction();
      tx2.setSender(walletAddress);

      xbridge.voteBurnRequest({
        tx: tx2,
        requestId,
        enclaveId: ENCLAVE_OBJECT_ID,
        validatorType: XSWAP_TYPE,
        signature: fromHex(voteData.signature),
        timestampMs: BigInt(voteData.timestamp_ms),
        coinType: body.coinType,
      });

      xbridge.executeBurnRequest({
        tx: tx2,
        requestId,
        burnCapId,
        presignCapId,
        messageCentralizedSignature,
        coinType: body.coinType,
      });

      const rawBytes2 = await tx2.build({ client: suiClient });

      const tx2Result = await signAndExecuteSuiTransaction(privy, {
        walletId: suiWallet.id,
        rawBytes: rawBytes2,
        suiClient,
        publicKey,
        options: { showEffects: true },
      });

      // === Phase 5: Get signId + Return ===
      await suiClient.waitForTransaction({ digest: tx2Result.digest });
      const updatedRequest = await xbridge.getBurnRequest({ requestId });

      return NextResponse.json({
        createDigest: tx1Result.digest,
        executeDigest: tx2Result.digest,
        requestId,
        signId: updatedRequest.signId,
        userSignature: toHex(userSolanaSignature),
        message: toHex(messageBytes),
      });
    } catch (caught: unknown) {
      if (caught instanceof WalletNotFoundError)
        return errorResponse(caught, caught.message, 404);

      // If tx1 succeeded but a later phase failed, include recovery info
      if (requestId && burnCapId) {
        const message =
          caught instanceof Error ? caught.message : 'Bridge burn failed';
        return NextResponse.json(
          {
            error: message,
            phase: 'post-create',
            requestId,
            burnCapId,
            presignCapId,
          },
          { status: 500 }
        );
      }

      return errorResponse(caught, 'Bridge burn failed');
    }
  },
  { verifyUserId: true }
);
