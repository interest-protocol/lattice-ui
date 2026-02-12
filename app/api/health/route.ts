import { NextResponse } from 'next/server';

import { SOLVER_API_URL } from '@/lib/config';
import { ENCLAVE_URL } from '@/lib/config.server';

export interface CombinedHealthResponse {
  enclave: { healthy: boolean };
  solver: { healthy: boolean };
}

const checkEnclave = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${ENCLAVE_URL}/health_check`, {
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) return false;
    await response.json();
    return true;
  } catch {
    return false;
  }
};

const checkSolver = async (): Promise<boolean> => {
  if (!SOLVER_API_URL) return false;
  try {
    const response = await fetch(`${SOLVER_API_URL}/api/health`, {
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) return false;
    const data = await response.json();
    return data.status === 'healthy';
  } catch {
    return false;
  }
};

export async function GET() {
  const [enclaveHealthy, solverHealthy] = await Promise.all([
    checkEnclave(),
    checkSolver(),
  ]);

  return NextResponse.json({
    enclave: { healthy: enclaveHealthy },
    solver: { healthy: solverHealthy },
  });
}
