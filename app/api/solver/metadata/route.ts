import { NextResponse } from 'next/server';

import { errorResponse } from '@/lib/api/validate-params';
import { getMetadata } from '@/lib/solver/server';

export async function GET() {
  try {
    const data = await getMetadata();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (caught: unknown) {
    return errorResponse(caught, 'Failed to fetch metadata');
  }
}
