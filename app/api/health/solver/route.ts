import { NextResponse } from 'next/server';

import { checkHealth } from '@/lib/api/health-check';
import { SOLVER_API_URL } from '@/lib/config';

export interface SolverHealthResponse {
  healthy: boolean;
}

export async function GET() {
  if (!SOLVER_API_URL) return NextResponse.json({ healthy: false });

  const healthy = await checkHealth(`${SOLVER_API_URL}/api/health`, {
    validateBody: (data) =>
      typeof data === 'object' &&
      data !== null &&
      (data as Record<string, unknown>).status === 'healthy',
  });

  return NextResponse.json({ healthy });
}
