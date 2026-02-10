import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { validateBody } from '@/lib/api/validate-params';
import { ENCLAVE_URL } from '@/lib/config';

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

  if (!ENCLAVE_URL)
    return NextResponse.json(
      { error: 'ENCLAVE_URL not configured' },
      { status: 500 }
    );

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
    const message =
      error instanceof Error ? error.message : 'Failed to fetch proof';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
