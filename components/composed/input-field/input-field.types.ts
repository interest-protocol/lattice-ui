import type { ReactNode } from 'react';

import type { AssetMetadata } from '@/interface';

export interface SwapFieldGroup {
  type: string;
  value: string;
  valueBN: bigint;
}

export interface SwapFormValues {
  from: SwapFieldGroup;
  to: SwapFieldGroup;
}

export type SwapFieldName = 'from' | 'to';

export interface InputFieldGenericProps {
  name: SwapFieldName;
  oppositeName?: SwapFieldName;
}

export interface InputFieldAssetProps {
  name: SwapFieldName;
  oppositeName: SwapFieldName;
  types: readonly string[];
}
export interface InputFieldModalProps {
  name: SwapFieldName;
  oppositeName: SwapFieldName;
  assetList: readonly AssetMetadata[];
}

export interface InputFieldProps extends InputFieldAssetProps {
  label?: string;
  disabled?: boolean;
  topContent?: ReactNode | 'balance';
  error?: string;
  variant?: 'from' | 'to';
}
