const DEFAULT_SUI_RPC_URL = 'https://fullnode.mainnet.sui.io:443';
export const SUI_RPC_URL =
  process.env.NEXT_PUBLIC_SUI_RPC_URL || DEFAULT_SUI_RPC_URL;

export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID!;

export const ENCLAVE_URL = process.env.NEXT_PUBLIC_ENCLAVE_URL!;

export const SOLVER_API_URL = process.env.NEXT_PUBLIC_SOLVER_API_URL!;
