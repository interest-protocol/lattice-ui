import { type NextRequest, NextResponse } from 'next/server';

import { errorResponse, validateQueryParam } from '@/lib/api/validate-params';
import { getRequestStatus } from '@/lib/solver/server';

export async function GET(request: NextRequest) {
  const requestId = request.nextUrl.searchParams.get('requestId');

  const paramError = validateQueryParam(requestId, 'requestId');
  if (paramError) return paramError;

  try {
    const data = await getRequestStatus(requestId);
    return NextResponse.json(data);
  } catch (caught: unknown) {
    return errorResponse(caught, 'Failed to fetch status');
  }
}
