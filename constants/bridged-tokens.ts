import { AssetMetadata } from '@/interface';

export const WSOL_SUI_TYPE =
  '0xb7844e289a8410e50fb3ca48d69eb9cf29e27d223ef90353fe1bd8e27ff8f3f8::coin::COIN';

export const WSUI_SOLANA_MINT =
  'G1vJEgzepqhnVu35BN4jrkv3wVwkujYWFFCxhbEZ1CZr';

export const WORMHOLE_DECIMALS = 8;

export const SOL_DECIMALS = 9;

export const SOLANA_RPC_URL = 'https://solana.publicnode.com';

export const BRIDGED_ASSET_METADATA: Record<string, AssetMetadata> = {
  [WSOL_SUI_TYPE]: {
    name: 'Solana (Wormhole)',
    decimals: WORMHOLE_DECIMALS,
    symbol: 'wSOL',
    type: WSOL_SUI_TYPE,
    iconUrl: 'https://cryptologos.cc/logos/solana-sol-logo.png?v=035',
  },
  [WSUI_SOLANA_MINT]: {
    name: 'Sui (Wormhole)',
    decimals: WORMHOLE_DECIMALS,
    symbol: 'wSUI',
    type: WSUI_SOLANA_MINT,
    iconUrl: 'https://strapi-dev.scand.app/uploads/sui_c07df05f00.png',
  },
};
