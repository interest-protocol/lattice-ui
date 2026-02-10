import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { validateBody } from '@/lib/api/validate-params';

const PYTH_HERMES_URL = 'https://hermes.pyth.network/v2/updates/price/latest';

const PYTH_FEED_IDS: Record<string, string> = {
  sui: '0x23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744',
  sol: '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
};

const FEED_ID_TO_COIN = Object.fromEntries(
  Object.entries(PYTH_FEED_IDS).map(([coin, id]) => [
    id.replace('0x', ''),
    coin,
  ])
);

const CACHE_TTL_SECONDS = 30;

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

const normalizeCoin = (coin: string): string =>
  coin.includes('::') ? 'sui' : coin.toLowerCase();

const schema = z.object({
  coins: z.array(z.string()),
});

export async function POST(request: NextRequest) {
  const { data: body, error } = validateBody(await request.json(), schema);
  if (error) return error;

  const normalized = body.coins.map(normalizeCoin);
  const feedIds = normalized
    .map((c: string) => PYTH_FEED_IDS[c])
    .filter(Boolean);

  if (!feedIds.length)
    return NextResponse.json(
      { error: 'No supported coins provided' },
      { status: 400 }
    );

  const cacheKey = feedIds.sort().join(',');
  const cached = cache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL_SECONDS * 1000) {
    return NextResponse.json(cached.data, {
      headers: {
        'X-Cache': 'HIT',
        'Cache-Control': `s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate`,
      },
    });
  }

  try {
    const params = new URLSearchParams();
    for (const id of feedIds) params.append('ids[]', id);

    const response = await fetch(`${PYTH_HERMES_URL}?${params.toString()}`);

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json({ error: text }, { status: response.status });
    }

    const json = await response.json();

    const data = (json.parsed ?? []).map(
      (feed: { id: string; price: { price: string; expo: number } }) => ({
        coin: FEED_ID_TO_COIN[feed.id] ?? feed.id,
        price: Number(feed.price.price) * 10 ** feed.price.expo,
      })
    );

    cache.set(cacheKey, { data, timestamp: now });

    return NextResponse.json(data, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': `s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate`,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch prices';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
