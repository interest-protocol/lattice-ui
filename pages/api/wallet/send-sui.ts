import { SuiClient } from '@mysten/sui/client';
import { messageWithIntent } from '@mysten/sui/cryptography';
import { Ed25519PublicKey } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { toSerializedSignature } from '@mysten/sui/cryptography';
import { PrivyClient } from '@privy-io/node';
import { NextApiHandler } from 'next';

const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? '';
const appSecret = process.env.PRIVY_APP_SECRET ?? '';

const handler: NextApiHandler = async (req, res) => {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const { userId, recipient, amount, coinType, rpcUrl } = req.body;

  if (!userId || typeof userId !== 'string')
    return res.status(400).json({ error: 'Missing userId' });
  if (!recipient || typeof recipient !== 'string')
    return res.status(400).json({ error: 'Missing recipient' });
  if (!amount || typeof amount !== 'string')
    return res.status(400).json({ error: 'Missing amount' });
  if (!appSecret)
    return res.status(500).json({ error: 'PRIVY_APP_SECRET not configured' });

  try {
    const privy = new PrivyClient({ appId, appSecret });

    // Find the user's Sui wallet
    const wallets = [];
    for await (const wallet of privy.wallets().list({
      user_id: userId,
      chain_type: 'sui',
    })) {
      wallets.push(wallet);
    }

    if (wallets.length === 0)
      return res.status(404).json({ error: 'No Sui wallet found' });

    const wallet = wallets[0];

    const client = new SuiClient({
      url: rpcUrl || 'https://fullnode.mainnet.sui.io:443',
    });

    // Build the transaction
    const tx = new Transaction();
    tx.setSender(wallet.address);

    if (!coinType || coinType === '0x2::sui::SUI') {
      // Native SUI transfer
      const [coin] = tx.splitCoins(tx.gas, [BigInt(amount)]);
      tx.transferObjects([coin], recipient);
    } else {
      // Token transfer (e.g., wSOL on Sui)
      const coins = await client.getCoins({
        owner: wallet.address,
        coinType,
      });

      if (!coins.data.length)
        return res.status(400).json({ error: 'No coins of this type found' });

      const primaryCoin = tx.object(coins.data[0].coinObjectId);

      if (coins.data.length > 1) {
        tx.mergeCoins(
          primaryCoin,
          coins.data.slice(1).map((c) => tx.object(c.coinObjectId))
        );
      }

      const [splitCoin] = tx.splitCoins(primaryCoin, [BigInt(amount)]);
      tx.transferObjects([splitCoin], recipient);
    }

    const rawBytes = await tx.build({ client });

    // Create intent message for signing
    const intentMessage = messageWithIntent('TransactionData', rawBytes);
    const bytesHex = Buffer.from(intentMessage).toString('hex');

    // Sign with Privy rawSign
    const signResult = await privy.wallets().rawSign(wallet.id, {
      params: {
        bytes: bytesHex,
        encoding: 'hex',
        hash_function: 'blake2b256',
      },
    });

    // Reconstruct signature
    const signatureBytes = Uint8Array.from(
      Buffer.from(signResult.signature, 'hex')
    );

    // Get the public key from the wallet address
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

    // Execute the transaction
    const result = await client.executeTransactionBlock({
      transactionBlock: Buffer.from(rawBytes).toString('base64'),
      signature: serializedSignature,
    });

    return res.status(200).json({ digest: result.digest });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to send transaction';
    return res.status(500).json({ error: message });
  }
};

export default handler;
