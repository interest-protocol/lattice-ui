import type { FC } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import useTokenPrices from '@/hooks/blockchain/use-token-prices';
import { formatDollars } from '@/utils';

import type { InputFieldGenericProps } from './input-field.types';

const InputFieldPrice: FC<InputFieldGenericProps> = ({ name }) => {
  const { control } = useFormContext();
  const { getPrice } = useTokenPrices();
  const value = useWatch({ control, name: `${name}.value` }) as string;
  const type = useWatch({ control, name: `${name}.type` }) as string;

  const price = getPrice(type);

  return (
    <span className="text-text-muted text-xs tabular-nums">
      {price != null ? formatDollars(price * Number(value), 2) : '—'}
    </span>
  );
};

export default InputFieldPrice;
