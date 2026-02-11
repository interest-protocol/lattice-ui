import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { errorResponse, validateBody } from '@/lib/api/validate-params';
import { ENCLAVE_URL } from '@/lib/config.server';

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

export async function POST(request: NextRequest) {
  const { data: body, error } = validateBody(await request.json(), schema);
  if (error) return error;

  try {
    const response = await fetch(`${ENCLAVE_URL}/new_request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({
        digest: body.digest,
        chain_id: body.chainId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: errorText },
        { status: response.status }
      );
    }

    const raw: NewRequestProofRaw = await response.json();

    return NextResponse.json(raw);
  } catch (error: unknown) {
    return errorResponse(error, 'Failed to fetch proof');
  }
}
