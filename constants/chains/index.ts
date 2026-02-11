import { SUI_TYPE_ARG } from '@mysten/sui/utils';

import { ASSET_METADATA, SOL_TYPE } from '@/constants/coins';

import type { ChainConfig, ChainKey } from './chain.types';

export type { ChainConfig, ChainKey } from './chain.types';

export const CHAIN_KEYS: readonly ChainKey[] = ['sui', 'solana'] as const;

export const CHAIN_REGISTRY: Record<ChainKey, ChainConfig> = {
  sui: {
    key: 'sui',
    displayName: 'Sui',
    color: '#4DA2FF',
    privyChainType: 'sui',
    nativeTokenType: SUI_TYPE_ARG,
    nativeToken: ASSET_METADATA[SUI_TYPE_ARG],
    addressFormat: { prefix: '0x', lengthRange: [66, 66] },
    addressPlaceholder: '0x...',
    noWalletMessage:
      'No Sui wallet connected. Create one from the Account page.',
    alphaMax: 0.5,
    minGas: 0.01,
    decimals: 9,
    displayPrecision: 4,
  },
  solana: {
    key: 'solana',
    displayName: 'Solana',
    color: '#9945FF',
    privyChainType: 'solana',
    nativeTokenType: SOL_TYPE,
    nativeToken: ASSET_METADATA[SOL_TYPE],
    addressFormat: { lengthRange: [32, 44] },
    addressPlaceholder: 'Solana address...',
    noWalletMessage: 'No Solana wallet connected. Connect one via Privy.',
    alphaMax: 0.001,
    minGas: 0.00001,
    decimals: 9,
    displayPrecision: 6,
  },
};

export const getChainConfig = (key: ChainKey): ChainConfig =>
  CHAIN_REGISTRY[key];

export const chainKeyFromTokenType = (tokenType: string): ChainKey =>
  tokenType === SUI_TYPE_ARG ? 'sui' : 'solana';
