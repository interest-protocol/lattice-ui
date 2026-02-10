/**
 * Centralized configuration for all NEXT_PUBLIC environment variables.
 * All public env vars should be accessed through this file.
 */

// Sui Network
const DEFAULT_SUI_RPC_URL = 'https://fullnode.mainnet.sui.io:443';
export const SUI_RPC_URL =
  process.env.NEXT_PUBLIC_SUI_RPC_URL || DEFAULT_SUI_RPC_URL;

// Privy Authentication
export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? '';

// Enclave API
export const ENCLAVE_URL = process.env.NEXT_PUBLIC_ENCLAVE_URL ?? '';

// Solver API
export const SOLVER_API_URL = process.env.NEXT_PUBLIC_SOLVER_API_URL ?? '';
