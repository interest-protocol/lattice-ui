import type { NextApiHandler } from 'next';

const SOLVER_API_URL = process.env.NEXT_PUBLIC_SOLVER_API_URL ?? '';

export interface SolverHealthResponse {
  healthy: boolean;
  status?: 'healthy' | 'degraded' | 'unhealthy';
  checks?: {
    database: boolean;
    redis: boolean;
    sui: boolean;
    solana: boolean;
    enclave: boolean;
  };
}

const handler: NextApiHandler = async (req, res) => {
  if (req.method !== 'GET')
    return res.status(405).json({ error: 'Method not allowed' });

  if (!SOLVER_API_URL) return res.status(200).json({ healthy: false });

  try {
    const response = await fetch(`${SOLVER_API_URL}/api/health`, {
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) {
      return res.status(200).json({ healthy: false });
    }

    const data = await response.json();
    return res.status(200).json({
      healthy: data.status === 'healthy',
      status: data.status,
      checks: data.checks,
    });
  } catch {
    return res.status(200).json({ healthy: false });
  }
};

export default handler;
