import type { NextApiHandler } from 'next';

import { ENCLAVE_URL } from '@/lib/config';

interface NewRequestProofRaw {
  signature: string;
  response: {
    digest: number[];
    chain_id: number;
    dwallet_address: number[];
    user: number[];
    token: number[];
    amount: number[];
  };
  timestamp_ms: string;
}

const handler: NextApiHandler = async (req, res) => {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const { digest, chainId } = req.body;

  if (!digest || typeof digest !== 'string')
    return res.status(400).json({ error: 'Missing digest' });

  if (!chainId || typeof chainId !== 'number')
    return res.status(400).json({ error: 'Missing chainId' });

  if (!ENCLAVE_URL)
    return res.status(500).json({ error: 'ENCLAVE_URL not configured' });

  try {
    const response = await fetch(`${ENCLAVE_URL}/new_request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({
        digest,
        chain_id: chainId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }

    const raw: NewRequestProofRaw = await response.json();

    return res.status(200).json(raw);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch proof';
    return res.status(500).json({ error: message });
  }
};

export default handler;
