import type { InputHTMLAttributes } from 'react';

export interface CheckedButtonProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'defaultValue'> {
  name: string;
  defaultValue: boolean;
  'aria-label'?: string;
}
