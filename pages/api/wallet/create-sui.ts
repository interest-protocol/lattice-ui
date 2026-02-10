import type { NextApiHandler } from 'next';

import { getPrivyClient } from '@/lib/privy/server';

const handler: NextApiHandler = async (req, res) => {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const { userId } = req.body;

  if (!userId || typeof userId !== 'string')
    return res.status(400).json({ error: 'Missing userId (did:privy:...)' });

  try {
    const privy = getPrivyClient();

    const wallet = await privy.wallets().create({
      chain_type: 'sui',
      owner: { user_id: userId },
    });

    return res.status(200).json({
      id: wallet.id,
      address: wallet.address,
      chainType: wallet.chain_type,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to create wallet';
    return res.status(500).json({ error: message });
  }
};

export default handler;
