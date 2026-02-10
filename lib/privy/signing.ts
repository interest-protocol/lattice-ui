import type { SuiClient } from '@mysten/sui/client';
import {
  messageWithIntent,
  toSerializedSignature,
} from '@mysten/sui/cryptography';
import { Ed25519PublicKey } from '@mysten/sui/keypairs/ed25519';
import type { PrivyClient } from '@privy-io/node';

interface SignAndExecuteParams {
  walletId: string;
  rawBytes: Uint8Array;
  suiClient: SuiClient;
  options?: {
    showEffects?: boolean;
    showObjectChanges?: boolean;
  };
}

export const signAndExecuteSuiTransaction = async (
  privy: PrivyClient,
  { walletId, rawBytes, suiClient, options }: SignAndExecuteParams
) => {
  const intentMessage = messageWithIntent('TransactionData', rawBytes);
  const bytesHex = Buffer.from(intentMessage).toString('hex');

  const signResult = await privy.wallets().rawSign(walletId, {
    params: {
      bytes: bytesHex,
      encoding: 'hex',
      hash_function: 'blake2b256',
    },
  });

  const signatureBytes = Uint8Array.from(
    Buffer.from(signResult.signature, 'hex')
  );

  const walletInfo = await privy.wallets().get(walletId);
  const publicKeyBytes = Uint8Array.from(
    Buffer.from(walletInfo.public_key ?? '', 'base64')
  );
  const publicKey = new Ed25519PublicKey(publicKeyBytes);

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
