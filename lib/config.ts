import invariant from 'tiny-invariant';

const DEFAULT_SUI_RPC_URL = 'https://fullnode.mainnet.sui.io:443';
export const SUI_RPC_URL =
  process.env.NEXT_PUBLIC_SUI_RPC_URL || DEFAULT_SUI_RPC_URL;

const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
invariant(privyAppId, 'NEXT_PUBLIC_PRIVY_APP_ID not configured');
export const PRIVY_APP_ID = privyAppId;

const solverApiUrl = process.env.NEXT_PUBLIC_SOLVER_API_URL;
invariant(solverApiUrl, 'NEXT_PUBLIC_SOLVER_API_URL not configured');
export const SOLVER_API_URL = solverApiUrl;
