import { NextResponse } from 'next/server';

import { SOLVER_API_URL } from '@/lib/config';

export interface SolverHealthResponse {
  healthy: boolean;
}

export async function GET() {
  if (!SOLVER_API_URL) return NextResponse.json({ healthy: false });

  try {
    const response = await fetch(`${SOLVER_API_URL}/api/health`, {
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) {
      return NextResponse.json({ healthy: false });
    }

    const data = await response.json();
    return NextResponse.json({ healthy: data.status === 'healthy' });
  } catch {
    return NextResponse.json({ healthy: false });
  }
}
