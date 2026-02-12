import { NextResponse } from 'next/server';
import { z } from 'zod';

import { errorResponse } from '@/lib/api/validate-params';
import { withAuthPost } from '@/lib/api/with-auth';
import { ENCLAVE_API_KEY, ENCLAVE_URL } from '@/lib/config.server';

interface NewRequestProofRaw {
  signature: string;
  response: {
    digest: number[];
    chain_id: number;
    dwallet_address: number[];
    user: number[];
    token: number[];
    amount: number[];
  };
  timestamp_ms: string;
}

const schema = z.object({
  digest: z.string(),
  chainId: z.number(),
});

export const POST = withAuthPost(schema, async (body) => {
  try {
    const response = await fetch(`${ENCLAVE_URL}/new_request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ENCLAVE_API_KEY,
      },
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({
        digest: body.digest,
        chain_id: body.chainId,
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Enclave request failed' },
        { status: response.status }
      );
    }

    const raw: NewRequestProofRaw = await response.json();

    return NextResponse.json(raw);
  } catch (caught: unknown) {
    return errorResponse(caught, 'Failed to fetch proof');
  }
});
