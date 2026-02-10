import { SUI_TYPE_ARG } from '@mysten/sui/utils';

import {
  BRIDGED_ASSET_METADATA,
  WSOL_SUI_TYPE,
  WSUI_SOLANA_MINT,
  XBRIDGE_DECIMALS,
} from '@/constants/bridged-tokens';
import { ASSET_METADATA, SOL_DECIMALS, SOL_TYPE } from '@/constants/coins';

import type { ChainKey } from './chain.types';

export interface ChainTokenOption {
  type: string;
  symbol: string;
  name: string;
  iconUrl?: string;
  decimals: number;
}

export const CHAIN_TOKENS: Record<ChainKey, ChainTokenOption[]> = {
  sui: [
    {
      type: SUI_TYPE_ARG,
      symbol: 'SUI',
      name: ASSET_METADATA[SUI_TYPE_ARG]?.name ?? 'Sui',
      iconUrl: ASSET_METADATA[SUI_TYPE_ARG]?.iconUrl,
      decimals: 9,
    },
    {
      type: WSOL_SUI_TYPE,
      symbol: BRIDGED_ASSET_METADATA[WSOL_SUI_TYPE]?.symbol ?? 'wSOL',
      name: BRIDGED_ASSET_METADATA[WSOL_SUI_TYPE]?.name ?? 'Solana (Wormhole)',
      iconUrl: BRIDGED_ASSET_METADATA[WSOL_SUI_TYPE]?.iconUrl,
      decimals: XBRIDGE_DECIMALS,
    },
  ],
  solana: [
    {
      type: SOL_TYPE,
      symbol: 'SOL',
      name: ASSET_METADATA[SOL_TYPE]?.name ?? 'Solana',
      iconUrl: ASSET_METADATA[SOL_TYPE]?.iconUrl,
      decimals: SOL_DECIMALS,
    },
    {
      type: WSUI_SOLANA_MINT,
      symbol: BRIDGED_ASSET_METADATA[WSUI_SOLANA_MINT]?.symbol ?? 'wSUI',
      name: BRIDGED_ASSET_METADATA[WSUI_SOLANA_MINT]?.name ?? 'Sui (Wormhole)',
      iconUrl: BRIDGED_ASSET_METADATA[WSUI_SOLANA_MINT]?.iconUrl,
      decimals: XBRIDGE_DECIMALS,
    },
  ],
};
