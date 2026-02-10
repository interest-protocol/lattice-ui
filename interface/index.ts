export type BigNumberish = bigint | string | number;

export interface AssetMetadata {
  name: string;
  type: string;
  symbol: string;
  iconUrl: string;
  decimals: number;
}

export interface Node {
  id: string;
  name: string;
}

export interface SdkPool {
  lpCoinType: string;
  coinTypes: string[];
  objectId: string;
  state: string;
}
