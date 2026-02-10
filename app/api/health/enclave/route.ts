import { NextResponse } from 'next/server';

import { ENCLAVE_URL } from '@/lib/config.server';

export interface EnclaveHealthResponse {
  healthy: boolean;
  pk?: string;
  rpcStatus?: {
    sui: Record<string, boolean>;
    solana: Record<string, boolean>;
  };
}

export async function GET() {
  try {
    const response = await fetch(`${ENCLAVE_URL}/health_check`, {
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) {
      return NextResponse.json({ healthy: false });
    }

    const data = await response.json();
    return NextResponse.json({
      healthy: true,
      pk: data.pk,
      rpcStatus: data.rpc_status,
    });
  } catch {
    return NextResponse.json({ healthy: false });
  }
}
