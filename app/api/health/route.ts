import { NextResponse } from 'next/server';

import { checkHealth } from '@/lib/api/health-check';
import { SOLVER_API_URL } from '@/lib/config';
import { ENCLAVE_URL } from '@/lib/config.server';

export interface CombinedHealthResponse {
  enclave: { healthy: boolean };
  solver: { healthy: boolean };
}

export async function GET() {
  const [enclaveHealthy, solverHealthy] = await Promise.all([
    checkHealth(`${ENCLAVE_URL}/health_check`),
    SOLVER_API_URL
      ? checkHealth(`${SOLVER_API_URL}/api/health`, {
          validateBody: (data) =>
            typeof data === 'object' &&
            data !== null &&
            (data as Record<string, unknown>).status === 'healthy',
        })
      : Promise.resolve(false),
  ]);

  return NextResponse.json({
    enclave: { healthy: enclaveHealthy },
    solver: { healthy: solverHealthy },
  });
}
