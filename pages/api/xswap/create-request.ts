import {
  DWALLET_COORDINATOR_SHARED_OBJECT_DATA,
  ENCLAVE_SHARED_OBJECT_DATA,
  MAINNET_PACKAGE_ID,
  XSwap,
  XSWAP_SHARED_OBJECT_DATA,
} from '@interest-protocol/xswap-sdk';
import { REGISTRY_SHARED_OBJECT_DATA } from '@interest-protocol/registry-sdk';
import {
  messageWithIntent,
  toSerializedSignature,
} from '@mysten/sui/cryptography';
import { Ed25519PublicKey } from '@mysten/sui/keypairs/ed25519';
import type { NextApiHandler } from 'next';

import { getPrivyClient } from '@/lib/privy/server';
import { getSuiClient } from '@/lib/xbridge/sui-client';

const XCORE_SHARED_OBJECT_DATA = {
  objectId:
    '0x4ad90f6e1dff41d0ed8e2eefc5f00dce6c31ef7cc4c2c7a01a43beaf8ea02f67',
  initialSharedVersion: '595876492',
} as const;

interface RequestProof {
  signature: number[];
  digest: number[];
  timestampMs: string;
  dwalletAddress: number[];
  user: number[];
  chainId: number;
  token: number[];
  amount: string;
}

interface CreateRequestBody {
  userId: string;
  proof: RequestProof;
  walletKey: string;
  sourceAddress: number[];
  sourceChain: number;
  destinationChain: number;
  destinationAddress: number[];
  destinationToken: number[];
  minDestinationAmount: string;
  minConfirmations: number;
  deadline: string;
  solverSender: number[];
  solverRecipient: number[];
  rpcUrl?: string;
}

const handler: NextApiHandler = async (req, res) => {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const body: CreateRequestBody = req.body;

  if (!body.userId) return res.status(400).json({ error: 'Missing userId' });
  if (!body.proof) return res.status(400).json({ error: 'Missing proof' });

  try {
    const privy = getPrivyClient();

    const wallets = [];
    for await (const wallet of privy.wallets().list({
      user_id: body.userId,
      chain_type: 'sui',
    })) {
      wallets.push(wallet);
    }

    if (wallets.length === 0)
      return res.status(404).json({ error: 'No Sui wallet found' });

    const wallet = wallets[0];

    const client = getSuiClient(body.rpcUrl);

    const xswap = new XSwap({
      suiClient: client,
      packageId: MAINNET_PACKAGE_ID,
      xswapSharedObjectData: XSWAP_SHARED_OBJECT_DATA,
      xcoreSharedObjectData: XCORE_SHARED_OBJECT_DATA,
      registrySharedObjectData: REGISTRY_SHARED_OBJECT_DATA,
      dwalletCoordinatorSharedObjectData: DWALLET_COORDINATOR_SHARED_OBJECT_DATA,
      enclaveSharedObjectData: ENCLAVE_SHARED_OBJECT_DATA,
    });

    const { tx, result } = xswap.newRequest({
      params: {
        signature: new Uint8Array(body.proof.signature),
        digest: new Uint8Array(body.proof.digest),
        timestampMs: BigInt(body.proof.timestampMs),
        walletKey: BigInt(body.walletKey),
        dwalletAddress: new Uint8Array(body.proof.dwalletAddress),
        sourceAddress: new Uint8Array(body.sourceAddress),
        sourceChain: body.sourceChain,
        sourceToken: new Uint8Array(body.proof.token),
        sourceAmount: BigInt(body.proof.amount),
        destinationChain: body.destinationChain,
        destinationToken: new Uint8Array(body.destinationToken),
        destinationAddress: new Uint8Array(body.destinationAddress),
        minDestinationAmount: BigInt(body.minDestinationAmount),
        minConfirmations: body.minConfirmations,
        deadline: BigInt(body.deadline),
        solverSender: new Uint8Array(body.solverSender),
        solverRecipient: new Uint8Array(body.solverRecipient),
      },
    });

    tx.setSender(wallet.address);

    xswap.shareRequest({ tx, request: result });

    const rawBytes = await tx.build({ client });

    const intentMessage = messageWithIntent('TransactionData', rawBytes);
    const bytesHex = Buffer.from(intentMessage).toString('hex');

    const signResult = await privy.wallets().rawSign(wallet.id, {
      params: {
        bytes: bytesHex,
        encoding: 'hex',
        hash_function: 'blake2b256',
      },
    });

    const signatureBytes = Uint8Array.from(
      Buffer.from(signResult.signature, 'hex')
    );

    const walletInfo = await privy.wallets().get(wallet.id);
    const publicKeyBytes = Uint8Array.from(
      Buffer.from(walletInfo.public_key ?? '', 'base64')
    );
    const publicKey = new Ed25519PublicKey(publicKeyBytes);

    const serializedSignature = toSerializedSignature({
      signature: signatureBytes,
      signatureScheme: 'ED25519',
      publicKey,
    });

    const txResult = await client.executeTransactionBlock({
      transactionBlock: Buffer.from(rawBytes).toString('base64'),
      signature: serializedSignature,
      options: {
        showObjectChanges: true,
      },
    });

    const requestObject = txResult.objectChanges?.find(
      (change) =>
        change.type === 'created' &&
        change.objectType?.includes('::xswap::Request')
    );

    const requestId =
      requestObject && 'objectId' in requestObject
        ? requestObject.objectId
        : null;
    const requestInitialSharedVersion =
      requestObject && 'version' in requestObject
        ? requestObject.version
        : null;

    return res.status(200).json({
      digest: txResult.digest,
      requestId,
      requestInitialSharedVersion,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to create request';
    return res.status(500).json({ error: message });
  }
};

export default handler;
