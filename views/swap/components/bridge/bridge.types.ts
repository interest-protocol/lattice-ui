import type BigNumber from 'bignumber.js';

import type { BridgeDirection, BridgeStatus } from '@/hooks/domain/use-bridge';

export type NetworkType = 'sui' | 'solana';
export type TokenKey = 'SUI' | 'SOL';

export interface TokenOption {
  symbol: string;
  iconUrl?: string;
  decimals: number;
}

export interface BridgeFormProps {
  sourceNetwork: NetworkType;
  setSourceNetwork: (net: NetworkType) => void;
  selectedToken: TokenKey;
  setSelectedToken: (tk: TokenKey) => void;
  amount: string;
  setAmount: (val: string) => void;
  isDisabled: boolean;
  isLoading: boolean;
  status: BridgeStatus;
  validationMessage: string | null;
  destNetwork: string;
  token: TokenOption;
  balanceLoading: boolean;
  balanceFormatted: string;
  setMaxAmount: () => void;
  onBridge: () => void;
}

export interface BridgeNetworkSelectorProps {
  sourceNetwork: NetworkType;
  setSourceNetwork: (net: NetworkType) => void;
}

export interface BridgeTokenSelectorProps {
  selectedToken: TokenKey;
  setSelectedToken: (tk: TokenKey) => void;
}

export interface BridgeAmountInputProps {
  amount: string;
  setAmount: (val: string) => void;
  token: TokenOption;
  balanceLoading: boolean;
  balanceFormatted: string;
  setMaxAmount: () => void;
}

export interface BridgeDetailsProps {
  sourceNetwork: NetworkType;
  selectedToken: TokenKey;
  destNetwork: string;
  amount: string;
}

export interface BridgeButtonProps {
  isDisabled: boolean;
  isLoading: boolean;
  status: BridgeStatus;
  validationMessage: string | null;
  token: TokenOption;
  destNetwork: string;
  onBridge: () => void;
}

export interface ValidationResult {
  isDisabled: boolean;
  message: string | null;
}
