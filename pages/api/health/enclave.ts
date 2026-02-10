import type { NextApiHandler } from 'next';

const ENCLAVE_URL = process.env.NEXT_PUBLIC_ENCLAVE_URL ?? '';

export interface EnclaveHealthResponse {
  healthy: boolean;
  pk?: string;
  rpcStatus?: {
    sui: Record<string, boolean>;
    solana: Record<string, boolean>;
  };
}

const handler: NextApiHandler = async (req, res) => {
  if (req.method !== 'GET')
    return res.status(405).json({ error: 'Method not allowed' });

  if (!ENCLAVE_URL) return res.status(200).json({ healthy: false });

  try {
    const response = await fetch(`${ENCLAVE_URL}/health_check`, {
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) {
      return res.status(200).json({ healthy: false });
    }

    const data = await response.json();
    return res.status(200).json({
      healthy: true,
      pk: data.pk,
      rpcStatus: data.rpc_status,
    });
  } catch {
    return res.status(200).json({ healthy: false });
  }
};

export default handler;
