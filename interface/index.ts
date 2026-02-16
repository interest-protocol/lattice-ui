export interface AssetMetadata {
  name: string;
  type: string;
  symbol: string;
  iconUrl: string;
  decimals: number;
}

export interface ValidationResult {
  isDisabled: boolean;
  message: string | null;
}
