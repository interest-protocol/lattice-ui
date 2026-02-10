/**
 * Alpha Test Limits
 *
 * During the closed alpha, we limit swap/bridge amounts due to low liquidity.
 * Users must also have enough native token for gas fees.
 */

// Maximum amounts allowed for swap/bridge (in human-readable units)
export const ALPHA_MAX_SUI = 0.1; // 0.1 SUI max
export const ALPHA_MAX_SOL = 0.001; // 0.001 SOL max

// Minimum gas required (in human-readable units)
export const MIN_GAS_SUI = 0.01; // ~0.01 SUI for gas
export const MIN_GAS_SOL = 0.00001; // ~0.00001 SOL (10,000 lamports) for gas
