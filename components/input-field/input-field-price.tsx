import { Span } from '@stylin.js/elements';
import { FC } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { useSuiPrice } from '@/hooks/use-sui-price';
import { formatDollars } from '@/utils';

import { InputFieldGenericProps } from './input-field.types';

const InputFieldPrice: FC<InputFieldGenericProps> = ({ name }) => {
  const { control } = useFormContext();
  const { data: suiPrice } = useSuiPrice();
  const value = useWatch({ control, name: `${name}.value` }) as string;

  // For now, we only support SUI price
  // TODO: Add SOL price support when implementing cross-chain swap
  const price = suiPrice ?? 0;

  return (
    <Span fontFamily="JetBrains Mono">
      {formatDollars(price * Number(value), 2)}
    </Span>
  );
};

export default InputFieldPrice;
