import type { NextApiHandler } from 'next';

const SOLVER_API_URL = process.env.NEXT_PUBLIC_SOLVER_API_URL ?? '';

const handler: NextApiHandler = async (req, res) => {
  if (req.method !== 'GET')
    return res.status(405).json({ error: 'Method not allowed' });

  if (!SOLVER_API_URL)
    return res.status(500).json({ error: 'SOLVER_API_URL not configured' });

  try {
    const response = await fetch(`${SOLVER_API_URL}/api/v1/prices`);

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch prices';
    return res.status(500).json({ error: message });
  }
};

export default handler;
