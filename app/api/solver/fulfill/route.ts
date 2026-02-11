import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { errorResponse, validateBody } from '@/lib/api/validate-params';
import { SOLVER_API_URL } from '@/lib/config';

const schema = z.object({
  requestId: z.string(),
  userAddress: z.string(),
  requestInitialSharedVersion: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const { data: body, error } = validateBody(await request.json(), schema);
  if (error) return error;

  if (!SOLVER_API_URL)
    return NextResponse.json(
      { error: 'SOLVER_API_URL not configured' },
      { status: 500 }
    );

  try {
    const response = await fetch(`${SOLVER_API_URL}/api/v1/fulfill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({
        requestId: body.requestId,
        userAddress: body.userAddress,
        requestInitialSharedVersion: body.requestInitialSharedVersion,
      }),
    });

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
    return errorResponse(error, 'Failed to fulfill request');
  }
}
