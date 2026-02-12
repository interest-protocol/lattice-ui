import type { ReactNode } from 'react';

import type { AssetMetadata } from '@/interface';

export interface InputFieldGenericProps {
  name: string;
  oppositeName?: string;
}

export interface InputFieldAssetProps extends InputFieldGenericProps {
  types: readonly string[];
}
export interface InputFieldModalProps extends InputFieldGenericProps {
  assetList: readonly AssetMetadata[];
}

export interface InputFieldProps extends InputFieldAssetProps {
  label?: string;
  disabled?: boolean;
  topContent?: ReactNode | 'balance';
  error?: string;
}
