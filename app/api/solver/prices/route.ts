import { NextResponse } from 'next/server';

import { errorResponse } from '@/lib/api/validate-params';
import { getPrices } from '@/lib/solver/server';

export async function GET() {
  try {
    const data = await getPrices();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
      },
    });
  } catch (caught: unknown) {
    const status = (caught as { status?: number })?.status ?? 500;
    return errorResponse(caught, 'Failed to fetch prices', status);
  }
}
