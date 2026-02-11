import { type NextRequest, NextResponse } from 'next/server';

import { errorResponse, validateQueryParam } from '@/lib/api/validate-params';
import { SOLVER_API_URL } from '@/lib/config';

export async function GET(request: NextRequest) {
  const requestId = request.nextUrl.searchParams.get('requestId');

  const invalid = validateQueryParam(requestId, 'requestId');
  if (invalid) return invalid;

  if (!SOLVER_API_URL)
    return NextResponse.json(
      { error: 'SOLVER_API_URL not configured' },
      { status: 500 }
    );

  try {
    const response = await fetch(
      `${SOLVER_API_URL}/api/v1/requests/${requestId}`,
      { signal: AbortSignal.timeout(10_000) }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    return errorResponse(error, 'Failed to fetch status');
  }
}
