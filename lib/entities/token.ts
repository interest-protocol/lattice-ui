import { SUI_TYPE_ARG } from '@mysten/sui/utils';
import invariant from 'tiny-invariant';

import type { ChainKey } from '@/constants/chains';
import { ASSET_METADATA, SOL_TYPE } from '@/constants/coins';
import type { AssetMetadata } from '@/interface';
import { coinTypeEquals, normalizeSuiCoinType } from '@/utils/sui';

interface TokenParams {
  chainId: ChainKey;
  type: string;
  decimals: number;
  symbol: string;
  name: string;
  iconUrl: string;
}

export class Token {
  readonly chainId: ChainKey;
  readonly type: string;
  readonly decimals: number;
  readonly symbol: string;
  readonly name: string;
  readonly iconUrl: string;

  constructor({ chainId, type, decimals, symbol, name, iconUrl }: TokenParams) {
    this.chainId = chainId;
    this.type = type;
    this.decimals = decimals;
    this.symbol = symbol;
    this.name = name;
    this.iconUrl = iconUrl;
  }

  equals(other: Token): boolean {
    return (
      this.chainId === other.chainId && coinTypeEquals(this.type, other.type)
    );
  }

  isSui(): boolean {
    return coinTypeEquals(this.type, SUI_TYPE_ARG);
  }

  isSol(): boolean {
    return this.type === SOL_TYPE;
  }

  toAssetMetadata(): AssetMetadata {
    return {
      name: this.name,
      type: this.type,
      symbol: this.symbol,
      iconUrl: this.iconUrl,
      decimals: this.decimals,
    };
  }

  static readonly SUI = new Token({
    chainId: 'sui',
    type: SUI_TYPE_ARG,
    decimals: 9,
    symbol: 'SUI',
    name: 'Sui',
    iconUrl: ASSET_METADATA[SUI_TYPE_ARG].iconUrl,
  });

  static readonly SOL = new Token({
    chainId: 'solana',
    type: SOL_TYPE,
    decimals: 9,
    symbol: 'SOL',
    name: 'Solana',
    iconUrl: ASSET_METADATA[SOL_TYPE].iconUrl,
  });

  private static readonly BY_TYPE: Record<string, Token> = {
    [normalizeSuiCoinType(SUI_TYPE_ARG)]: Token.SUI,
    [SOL_TYPE]: Token.SOL,
  };

  static fromType(type: string): Token {
    const token = Token.BY_TYPE[normalizeSuiCoinType(type)];
    invariant(token, `Unknown token type: ${type}`);
    return token;
  }
}
