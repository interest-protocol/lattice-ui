import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { authenticateRequest } from '@/lib/api/auth';
import { errorResponse, validateBody } from '@/lib/api/validate-params';
import { SOLVER_API_URL } from '@/lib/config';

const schema = z.object({
  requestId: z.string(),
  userAddress: z.string(),
  requestInitialSharedVersion: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return auth;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { data: body, error } = validateBody(rawBody, schema);
  if (error) return error;

  if (!SOLVER_API_URL)
    return NextResponse.json({ error: 'Service unavailable' }, { status: 500 });

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
      return NextResponse.json(
        { error: 'Fulfillment request failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (caught: unknown) {
    return errorResponse(caught, 'Failed to fulfill request');
  }
}
