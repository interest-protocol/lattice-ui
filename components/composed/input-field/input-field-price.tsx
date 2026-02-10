import { Span } from '@stylin.js/elements';
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

  return (
    <Span fontFamily="JetBrains Mono">
      {formatDollars(getPrice(type) * Number(value), 2)}
    </Span>
  );
};

export default InputFieldPrice;
