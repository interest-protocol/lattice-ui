import type { NextApiHandler } from 'next';

const SOLVER_API_URL = process.env.NEXT_PUBLIC_SOLVER_API_URL ?? '';

const handler: NextApiHandler = async (req, res) => {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const { requestId, userAddress, requestInitialSharedVersion } = req.body;

  if (!requestId || typeof requestId !== 'string')
    return res.status(400).json({ error: 'Missing requestId' });

  if (!userAddress || typeof userAddress !== 'string')
    return res.status(400).json({ error: 'Missing userAddress' });

  if (!SOLVER_API_URL)
    return res.status(500).json({ error: 'SOLVER_API_URL not configured' });

  try {
    const response = await fetch(`${SOLVER_API_URL}/api/v1/fulfill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestId,
        userAddress,
        requestInitialSharedVersion,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to fulfill request';
    return res.status(500).json({ error: message });
  }
};

export default handler;
