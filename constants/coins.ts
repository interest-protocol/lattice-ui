import { SUI_TYPE_ARG } from '@mysten/sui/utils';

import type { AssetMetadata } from '@/interface';

// Solana token type identifier
export const SOL_TYPE = 'sol';

// Main tradeable coins for SUI/SOL swap
export const COIN_TYPES: ReadonlyArray<string> = [SUI_TYPE_ARG, SOL_TYPE];

// Legacy staking types (deprecated - kept for compatibility)
export const LST_TYPES: ReadonlyArray<string> = [];
export const LST_TYPES_KEY: ReadonlyArray<string> = [];
export const NFT_TYPES: ReadonlyArray<string> = [];

export const ASSET_METADATA: Record<string, AssetMetadata> = {
  [SUI_TYPE_ARG]: {
    name: 'Sui',
    decimals: 9,
    symbol: 'SUI',
    type: SUI_TYPE_ARG,
    iconUrl: 'https://strapi-dev.scand.app/uploads/sui_c07df05f00.png',
  },
  [SOL_TYPE]: {
    name: 'Solana',
    decimals: 9,
    symbol: 'SOL',
    type: SOL_TYPE,
    iconUrl: 'https://cryptologos.cc/logos/solana-sol-logo.png?v=035',
  },
};
