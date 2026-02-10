import { type NextRequest, NextResponse } from 'next/server';

import { SOLVER_API_URL } from '@/lib/config';

export async function POST(request: NextRequest) {
  const { requestId, userAddress, requestInitialSharedVersion } =
    await request.json();

  if (!requestId || typeof requestId !== 'string')
    return NextResponse.json({ error: 'Missing requestId' }, { status: 400 });

  if (!userAddress || typeof userAddress !== 'string')
    return NextResponse.json({ error: 'Missing userAddress' }, { status: 400 });

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
        requestId,
        userAddress,
        requestInitialSharedVersion,
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
    const message =
      error instanceof Error ? error.message : 'Failed to fulfill request';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
