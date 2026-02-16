import { type NextRequest, NextResponse } from 'next/server';

import { errorResponse } from '@/lib/api/validate-params';
import { getRequestStatus } from '@/lib/solver/server';

export async function GET(request: NextRequest) {
  const requestId = request.nextUrl.searchParams.get('requestId');

  if (!requestId) {
    return NextResponse.json({ error: 'Missing requestId' }, { status: 400 });
  }

  try {
    const data = await getRequestStatus(requestId);
    return NextResponse.json(data);
  } catch (caught: unknown) {
    const status = (caught as { status?: number })?.status ?? 500;
    return errorResponse(caught, 'Failed to fetch status', status);
  }
}
