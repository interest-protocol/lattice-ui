import type { AssetMetadata } from '@/interface';

const XBRIDGE_ORIGINAL_PACKAGE_ID =
  '0xb39fe0c60c140063923a723f4e0e5bc008d1593ae3c6a71aa89fed5dc3546c15';
const XBRIDGE_TOKENS_PACKAGE_ID =
  '0x6ca737ee1a09538b3a1335d75f676300c88db1440086f77eb33c46ecf8c67b12';
const WRAPPED_SOL_OTW = `${XBRIDGE_TOKENS_PACKAGE_ID}::tokens::WrappedSol`;

export const WSOL_SUI_TYPE = `${XBRIDGE_ORIGINAL_PACKAGE_ID}::inbound::XToken<${WRAPPED_SOL_OTW}>`;

export const WSUI_SOLANA_MINT = 'F8x6mpvp4PHTgNyb617zEvKhrN5G5fkJKnXsNCCHUHeB';

export const XBRIDGE_DECIMALS = 9;

export const SOLANA_RPC_URL = 'https://solana.publicnode.com';

export const BRIDGED_ASSET_METADATA: Record<string, AssetMetadata> = {
  [WSOL_SUI_TYPE]: {
    name: 'Wrapped SOL (XBridge)',
    decimals: XBRIDGE_DECIMALS,
    symbol: 'wSOL',
    type: WSOL_SUI_TYPE,
    iconUrl: 'https://cryptologos.cc/logos/solana-sol-logo.png?v=035',
  },
  [WSUI_SOLANA_MINT]: {
    name: 'Wrapped SUI (XBridge)',
    decimals: XBRIDGE_DECIMALS,
    symbol: 'wSUI',
    type: WSUI_SOLANA_MINT,
    iconUrl: 'https://strapi-dev.scand.app/uploads/sui_c07df05f00.png',
  },
};
