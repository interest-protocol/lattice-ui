import { NextResponse } from 'next/server';
import { z } from 'zod';

import { errorResponse } from '@/lib/api/validate-params';
import { withAuthPost } from '@/lib/api/with-auth';
import { newRequest } from '@/lib/enclave/server';

const schema = z.object({
  digest: z.string(),
  chainId: z.number(),
});

export const POST = withAuthPost(schema, async (body) => {
  try {
    const raw = await newRequest({
      digest: body.digest,
      chain_id: body.chainId,
    });

    return NextResponse.json(raw);
  } catch (caught: unknown) {
    return errorResponse(caught, 'Failed to fetch proof');
  }
});
