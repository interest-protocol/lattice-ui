import { NextResponse } from 'next/server';
import { z } from 'zod';

import { errorResponse } from '@/lib/api/validate-params';
import { withAuthPost } from '@/lib/api/with-auth';
import { SOLVER_API_URL } from '@/lib/config';
import { SOLVER_API_KEY } from '@/lib/config.server';

const schema = z.object({
  requestId: z.string(),
  userAddress: z.string(),
  requestInitialSharedVersion: z.string().optional(),
});

export const POST = withAuthPost(schema, async (body) => {
  if (!SOLVER_API_URL)
    return NextResponse.json({ error: 'Service unavailable' }, { status: 500 });

  try {
    const response = await fetch(`${SOLVER_API_URL}/api/v1/fulfill`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': SOLVER_API_KEY,
      },
      signal: AbortSignal.timeout(15_000),
      body: JSON.stringify({
        requestId: body.requestId,
        userAddress: body.userAddress,
        requestInitialSharedVersion: body.requestInitialSharedVersion,
      }),
    });

    if (!response.ok) {
      const upstream = await response.json().catch(() => null);
      const message = upstream?.error ?? 'Fulfillment request failed';
      return NextResponse.json({ error: message }, { status: response.status });
    }

    const json = await response.json();
    return NextResponse.json(json.data);
  } catch (caught: unknown) {
    return errorResponse(caught, 'Failed to fulfill request');
  }
});
