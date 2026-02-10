import type { NextApiHandler } from 'next';

const RATES_API_URL =
  'https://rates-api-production.up.railway.app/api/fetch-quote';

const CACHE_TTL_SECONDS = 30;

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

const getCacheKey = (coins: string[]): string => coins.sort().join(',');

const handler: NextApiHandler = async (req, res) => {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const { coins } = req.body;

  if (!coins || !Array.isArray(coins))
    return res.status(400).json({ error: 'Missing coins array in body' });

  const cacheKey = getCacheKey(coins);
  const cached = cache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL_SECONDS * 1000) {
    res.setHeader('X-Cache', 'HIT');
    res.setHeader(
      'Cache-Control',
      `s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate`
    );
    return res.status(200).json(cached.data);
  }

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

    cache.set(cacheKey, { data, timestamp: now });

    res.setHeader('X-Cache', 'MISS');
    res.setHeader(
      'Cache-Control',
      `s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate`
    );
    return res.status(200).json(data);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch prices';
    return res.status(500).json({ error: message });
  }
};

export default handler;
