import { type NextRequest, NextResponse } from 'next/server';

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

export async function POST(request: NextRequest) {
  const { digest, chainId } = await request.json();

  if (!digest || typeof digest !== 'string')
    return NextResponse.json({ error: 'Missing digest' }, { status: 400 });

  if (!chainId || typeof chainId !== 'number')
    return NextResponse.json({ error: 'Missing chainId' }, { status: 400 });

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
        digest,
        chain_id: chainId,
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
