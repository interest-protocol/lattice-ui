import { ChainId } from '@interest-protocol/xswap-sdk';

import type { ChainKey } from '@/constants/chains';

export type SupportedChainId = typeof ChainId.Sui | typeof ChainId.Solana;

export const CHAIN_KEY_TO_SDK_ID: Record<ChainKey, SupportedChainId> = {
  sui: ChainId.Sui,
  solana: ChainId.Solana,
};

export const sdkChainIdFromKey = (key: ChainKey): SupportedChainId =>
  CHAIN_KEY_TO_SDK_ID[key];
