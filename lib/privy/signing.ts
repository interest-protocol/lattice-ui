import type { SuiClient } from '@mysten/sui/client';
import {
  messageWithIntent,
  toSerializedSignature,
} from '@mysten/sui/cryptography';
import { Ed25519PublicKey } from '@mysten/sui/keypairs/ed25519';
import type { PrivyClient } from '@privy-io/node';
import invariant from 'tiny-invariant';

import { PRIVY_AUTHORIZATION_KEY } from '@/lib/config.server';

export const authorizationContext = {
  authorization_private_keys: [PRIVY_AUTHORIZATION_KEY],
};

interface SignAndExecuteParams {
  walletId: string;
  rawBytes: Uint8Array;
  suiClient: SuiClient;
  publicKey?: Ed25519PublicKey;
  options?: {
    showEffects?: boolean;
    showObjectChanges?: boolean;
  };
}

export const extractPublicKey = (rawString: string): Ed25519PublicKey => {
  const isHex = /^(0x)?[0-9a-fA-F]+$/.test(rawString) && rawString.length >= 64;
  const decoded = isHex
    ? Buffer.from(rawString.replace(/^0x/, ''), 'hex')
    : Buffer.from(rawString, 'base64');

  const keyBytes = Uint8Array.from(
    decoded.length > 32 ? decoded.subarray(decoded.length - 32) : decoded
  );
  return new Ed25519PublicKey(keyBytes);
};

export const signAndExecuteSuiTransaction = async (
  privy: PrivyClient,
  {
    walletId,
    rawBytes,
    suiClient,
    publicKey: cachedPublicKey,
    options,
  }: SignAndExecuteParams
) => {
  const intentMessage = messageWithIntent('TransactionData', rawBytes);
  const intentBase64 = Buffer.from(intentMessage).toString('base64');

  const signResult = await privy.wallets().rawSign(walletId, {
    params: {
      bytes: intentBase64,
      encoding: 'base64',
      hash_function: 'blake2b256',
    },
    authorization_context: authorizationContext,
  });

  const sigHex = signResult.signature.replace(/^0x/, '');
  const signatureBytes = Uint8Array.from(Buffer.from(sigHex, 'hex'));

  let publicKey = cachedPublicKey;
  if (!publicKey) {
    const walletInfo = await privy.wallets().get(walletId);
    invariant(walletInfo.public_key, `Wallet ${walletId} has no public key`);
    publicKey = extractPublicKey(walletInfo.public_key);
  }

  const serializedSignature = toSerializedSignature({
    signature: signatureBytes,
    signatureScheme: 'ED25519',
    publicKey,
  });

  const result = await suiClient.executeTransactionBlock({
    transactionBlock: Buffer.from(rawBytes).toString('base64'),
    signature: serializedSignature,
    options,
  });

  return result;
};
