import { NextResponse } from 'next/server';

import { checkHealth } from '@/lib/api/health-check';
import { ENCLAVE_URL } from '@/lib/config.server';

export interface EnclaveHealthResponse {
  healthy: boolean;
}

export async function GET() {
  const healthy = await checkHealth(`${ENCLAVE_URL}/health_check`);
  return NextResponse.json({ healthy });
}
