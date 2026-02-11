import { NextResponse } from 'next/server';

import { ENCLAVE_URL } from '@/lib/config.server';

export interface EnclaveHealthResponse {
  healthy: boolean;
}

export async function GET() {
  try {
    const response = await fetch(`${ENCLAVE_URL}/health_check`, {
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) {
      return NextResponse.json({ healthy: false });
    }

    await response.json();
    return NextResponse.json({ healthy: true });
  } catch {
    return NextResponse.json({ healthy: false });
  }
}
