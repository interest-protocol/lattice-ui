import { Span } from '@stylin.js/elements';
import type { FC } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { useSuiPrice } from '@/hooks/blockchain/use-sui-price';
import { formatDollars } from '@/utils';

import type { InputFieldGenericProps } from './input-field.types';

const InputFieldPrice: FC<InputFieldGenericProps> = ({ name }) => {
  const { control } = useFormContext();
  const { data: suiPrice } = useSuiPrice();
  const value = useWatch({ control, name: `${name}.value` }) as string;

  const price = suiPrice ?? 0;

  return (
    <Span fontFamily="JetBrains Mono">
      {formatDollars(price * Number(value), 2)}
    </Span>
  );
};

export default InputFieldPrice;
