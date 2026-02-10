import type { AssetMetadata } from '@/interface';

export type ChainKey = 'sui' | 'solana';

export interface ChainConfig {
  key: ChainKey;
  displayName: string;
  color: string;
  privyChainType: string;
  nativeTokenType: string;
  nativeToken: AssetMetadata;
  addressFormat: { prefix?: string; lengthRange: [number, number] };
  addressPlaceholder: string;
  noWalletMessage: string;
  alphaMax: number;
  minGas: number;
  decimals: number;
  displayPrecision: number;
}
