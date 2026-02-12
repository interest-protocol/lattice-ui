import { NextResponse } from 'next/server';

import { errorResponse } from '@/lib/api/validate-params';
import { SOLVER_API_URL } from '@/lib/config';
import { SOLVER_API_KEY } from '@/lib/config.server';

export async function GET() {
  if (!SOLVER_API_URL)
    return NextResponse.json({ error: 'Service unavailable' }, { status: 500 });

  try {
    const response = await fetch(`${SOLVER_API_URL}/api/v1/metadata`, {
      headers: { 'x-api-key': SOLVER_API_KEY },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch metadata' },
        { status: response.status }
      );
    }

    const json = await response.json();
    return NextResponse.json(json.data);
  } catch (error: unknown) {
    return errorResponse(error, 'Failed to fetch metadata');
  }
}
