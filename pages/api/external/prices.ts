import type { NextApiHandler } from 'next';

const RATES_API_URL =
  'https://rates-api-production.up.railway.app/api/fetch-quote';

const handler: NextApiHandler = async (req, res) => {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const { coins } = req.body;

  if (!coins || !Array.isArray(coins))
    return res.status(400).json({ error: 'Missing coins array in body' });

  try {
    const response = await fetch(RATES_API_URL, {
      method: 'POST',
      headers: {
        accept: '*/*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ coins }),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
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
