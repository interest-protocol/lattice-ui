import { type NextRequest, NextResponse } from 'next/server';

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMITS: Record<string, number> = {
  '/api/wallet/create-sui': 5,
  '/api/wallet/create-solana': 5,
  '/api/wallet/send-sui': 20,
  '/api/wallet/send-solana': 20,
  '/api/wallet/link-solana': 5,
  '/api/xswap/create-request': 20,
  '/api/solver/fulfill': 20,
  '/api/enclave/new-request': 20,
};

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const getRateLimitKey = (ip: string, path: string) => `${ip}:${path}`;

const isRateLimited = (key: string, limit: number): boolean => {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > limit;
};

// Periodic cleanup of expired entries
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetAt) rateLimitStore.delete(key);
  }
}, RATE_LIMIT_WINDOW_MS);

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const limit = RATE_LIMITS[path];

  if (!limit) return NextResponse.next();

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';

  const key = getRateLimitKey(ip, path);

  if (isRateLimited(key, limit)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
