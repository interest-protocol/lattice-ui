import { WRAPPED_SOL_TYPE } from '@interest-protocol/xbridge-sdk';

import type { AssetMetadata } from '@/interface';

export const WSOL_SUI_TYPE = WRAPPED_SOL_TYPE;

export const WSUI_SOLANA_MINT = 'F8x6mpvp4PHTgNyb617zEvKhrN5G5fkJKnXsNCCHUHeB';

export const XBRIDGE_DECIMALS = 9;

export const BRIDGED_ASSET_METADATA: Record<string, AssetMetadata> = {
  [WSOL_SUI_TYPE]: {
    name: 'Wrapped SOL (XBridge)',
    decimals: XBRIDGE_DECIMALS,
    symbol: 'wSOL',
    type: WSOL_SUI_TYPE,
    iconUrl: '/sol-logo.svg',
  },
  [WSUI_SOLANA_MINT]: {
    name: 'Wrapped SUI (XBridge)',
    decimals: XBRIDGE_DECIMALS,
    symbol: 'wSUI',
    type: WSUI_SOLANA_MINT,
    iconUrl: '/sui-logo.svg',
  },
};
