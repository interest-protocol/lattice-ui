import { NextResponse } from 'next/server';
import { z } from 'zod';

import { errorResponse } from '@/lib/api/validate-params';
import { withAuthPost } from '@/lib/api/with-auth';
import { fulfill } from '@/lib/solver/server';

const schema = z.object({
  requestId: z.string(),
  userAddress: z.string(),
  requestInitialSharedVersion: z.string().optional(),
});

export const POST = withAuthPost(schema, async (body) => {
  try {
    const data = await fulfill(body);
    return NextResponse.json(data);
  } catch (caught: unknown) {
    return errorResponse(caught, 'Fulfillment request failed');
  }
});
