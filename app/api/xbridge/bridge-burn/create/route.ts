import { ChainId, DWalletAddress } from '@interest-protocol/xbridge-sdk';
import { coinWithBalance, Transaction } from '@mysten/sui/transactions';
import { fromBase64, toBase64, toHex } from '@mysten/sui/utils';
import { address } from '@solana/kit';
import { fetchMaybeNonce } from '@solana-program/system';
import bs58 from 'bs58';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { WSOL_SUI_TYPE } from '@/constants/bridged-tokens';
import { NATIVE_SOL_MINT, SOL_DECIMALS } from '@/constants/coins';
import { createRouteLogger } from '@/lib/api/route-logger';
import { errorResponse } from '@/lib/api/validate-params';
import { withAuthPost } from '@/lib/api/with-auth';
import { bigintString } from '@/lib/api/zod-schemas';
import { PRIVY_AUTHORIZATION_KEY } from '@/lib/config.server';
import { getPrivyClient } from '@/lib/privy/server';
import {
  getWalletPublicKey,
  signAndExecuteSuiTransaction,
} from '@/lib/privy/signing';
import { getFirstWallet, WalletNotFoundError } from '@/lib/privy/wallet';
import { getSolanaRpc } from '@/lib/solana/server';
import { buildNativeSolTransfer } from '@/lib/solana/solana-message';
import { findCreatedObjectId } from '@/lib/sui/object-changes';
import { waitForObjects } from '@/lib/sui/wait-for-objects';
import { createXBridgeSdk } from '@/lib/xbridge';

const schema = z.object({
  userId: z.string(),
  sourceAmount: bigintString,
  destinationAddress: z.array(z.number().int().min(0).max(255)).length(32),
  nonceAddress: z
    .string()
    .regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, 'Invalid Solana nonce address'),
  coinType: z.string(),
});

export const POST = withAuthPost(
  schema,
  async (body) => {
    const log = createRouteLogger('bridge-burn/create');
    log.start(`sourceAmount=${body.sourceAmount} coinType=${body.coinType}`);

    try {
      const privy = getPrivyClient();

      const [suiWallet, solanaWallet] = await Promise.all([
        getFirstWallet(privy, body.userId, 'sui'),
        getFirstWallet(privy, body.userId, 'solana'),
      ]);

      const { suiClient, xbridge } = createXBridgeSdk();

      const publicKey = await getWalletPublicKey(privy, suiWallet.id);

      const walletAddress = suiWallet.address;
      const userSolanaAddress = solanaWallet.address;
      log.info('Phase 0 setup done');

      const dwalletSolana = DWalletAddress[ChainId.Solana];

      const rpc = getSolanaRpc();
      const nonceResult = await fetchMaybeNonce(
        rpc,
        address(body.nonceAddress)
      );
      if (!nonceResult.exists) {
        return NextResponse.json(
          { error: 'Nonce account not found' },
          { status: 400 }
        );
      }
      const nonceValue = nonceResult.data.blockhash;
      const nonceBytes = bs58.decode(nonceValue as string);

      const dWalletBytes = bs58.decode(dwalletSolana);
      const nonceAccountBytes = bs58.decode(body.nonceAddress);
      const destinationWalletBytes = new Uint8Array(body.destinationAddress);

      if (destinationWalletBytes.length !== 32) {
        return NextResponse.json(
          { error: 'Destination Solana address must be 32 bytes' },
          { status: 400 }
        );
      }
      if (bs58.encode(destinationWalletBytes) !== userSolanaAddress) {
        return NextResponse.json(
          {
            error:
              'Destination wallet must match the connected Solana wallet for native SOL burn',
          },
          { status: 400 }
        );
      }

      const messageBytes = buildNativeSolTransfer({
        dWallet: dWalletBytes,
        nonce: nonceBytes,
        nonceAccount: nonceAccountBytes,
        destinationWallet: destinationWalletBytes,
        amount: BigInt(body.sourceAmount),
      });
      if (messageBytes.length !== 224) {
        return NextResponse.json(
          { error: `Invalid native SOL message length: ${messageBytes.length}` },
          { status: 400 }
        );
      }

      const wireTx = Buffer.concat([
        Buffer.from([2]),
        Buffer.alloc(64),
        Buffer.alloc(64),
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

      const signedTxBytes = fromBase64(signResult.signed_transaction);
      const userSolanaSignature = signedTxBytes.subarray(1, 65);

      log.info('Phase 1 native SOL message + presign done');

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
        dwalletAddress: dWalletBytes,
        message: messageBytes,
        nonce: nonceBytes,
        nonceAccount: nonceAccountBytes,
        destinationWallet: destinationWalletBytes,
        destinationAta: destinationWalletBytes,
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
      const { result: presignCap } = xbridge.takePresign({
        tx: tx1,
        chainId: ChainId.Solana,
        fee: presignFee,
      });
      tx1.transferObjects([presignCap], walletAddress);

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

      if (!requestId || !burnCapId || !presignCapId) {
        return NextResponse.json(
          { error: 'Failed to extract requestId, burnCapId, or presignCapId from tx1' },
          { status: 500 }
        );
      }
      log.info(
        `Phase 2 Tx1 done requestId=${requestId} burnCapId=${burnCapId} presignCapId=${presignCapId} digest=${tx1Result.digest}`
      );

      await suiClient.waitForTransaction({ digest: tx1Result.digest });
      await waitForObjects(suiClient, [requestId, burnCapId, presignCapId]);
      log.info('done');

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
      log.error('error', caught);

      if (caught instanceof WalletNotFoundError)
        return errorResponse(caught, caught.message, 404);

      return errorResponse(caught, 'Bridge burn create failed');
    }
  },
  { verifyUserId: true }
);
