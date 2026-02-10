import type { NextApiHandler } from 'next';

const PYTH_HERMES_URL = 'https://hermes.pyth.network/v2/updates/price/latest';

const PYTH_FEED_IDS: Record<string, string> = {
  sui: '0x23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744',
  sol: '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
};

const FEED_ID_TO_COIN = Object.fromEntries(
  Object.entries(PYTH_FEED_IDS).map(([coin, id]) => [id.replace('0x', ''), coin])
);

const CACHE_TTL_SECONDS = 30;

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

const normalizeCoin = (coin: string): string =>
  coin.includes('::') ? 'sui' : coin.toLowerCase();

const handler: NextApiHandler = async (req, res) => {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const { coins } = req.body;

  if (!coins || !Array.isArray(coins))
    return res.status(400).json({ error: 'Missing coins array in body' });

  const normalized = coins.map(normalizeCoin);
  const feedIds = normalized
    .map((c) => PYTH_FEED_IDS[c])
    .filter(Boolean);

  if (!feedIds.length)
    return res.status(400).json({ error: 'No supported coins provided' });

  const cacheKey = feedIds.sort().join(',');
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
    const params = new URLSearchParams();
    for (const id of feedIds) params.append('ids[]', id);

    const response = await fetch(`${PYTH_HERMES_URL}?${params.toString()}`);

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
    }

    const json = await response.json();

    const data = (json.parsed ?? []).map(
      (feed: { id: string; price: { price: string; expo: number } }) => ({
        coin: FEED_ID_TO_COIN[feed.id] ?? feed.id,
        price: Number(feed.price.price) * 10 ** feed.price.expo,
      })
    );

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
