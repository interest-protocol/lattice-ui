import { SUI_TYPE_ARG } from '@mysten/sui/utils';

import type { AssetMetadata } from '@/interface';

export const SOL_TYPE = 'sol';

export const NATIVE_SOL_MINT = 'So11111111111111111111111111111111111111112';
export const SOL_DECIMALS = 9;
export const SUI_DECIMALS = 9;

export const REQUEST_DEADLINE_MS = 60 * 60 * 1000;
export const BALANCE_POLL_INTERVAL_MS = 5000;
export const BALANCE_POLL_MAX_ATTEMPTS = 24;

export const COIN_TYPES: ReadonlyArray<string> = [SUI_TYPE_ARG, SOL_TYPE];

export const ASSET_METADATA: Record<string, AssetMetadata> = {
  [SUI_TYPE_ARG]: {
    name: 'Sui',
    decimals: 9,
    symbol: 'SUI',
    type: SUI_TYPE_ARG,
    iconUrl: '/sui-logo.svg',
  },
  [SOL_TYPE]: {
    name: 'Solana',
    decimals: 9,
    symbol: 'SOL',
    type: SOL_TYPE,
    iconUrl: 'https://cryptologos.cc/logos/solana-sol-logo.png?v=035',
  },
};
