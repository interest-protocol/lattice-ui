import { Div, Input, Span } from '@stylin.js/elements';
import type { FC } from 'react';
import { useFormContext } from 'react-hook-form';

import { CurrencyAmount, Token } from '@/lib/entities';
import { parseInputEventToNumberString } from '@/utils';

import InputFieldAsset from './input-field-asset';
import InputFieldBalance from './input-field-balance';
import InputFieldBalances from './input-field-balances';
import InputFieldPrice from './input-field-price';
import type { InputFieldProps } from './input-field.types';

const InputField: FC<InputFieldProps> = ({
  name,
  label,
  types,
  disabled,
  topContent,
  oppositeName,
}) => {
  const { register, setValue, getValues } = useFormContext();

  return (
    <Div
      p="1rem"
      gap="1rem"
      bg="#FFFFFF0D"
      display="flex"
      color="#FFFFFF80"
      borderRadius="1rem"
      fontSize="0.875rem"
      flexDirection="column"
      border="1px solid #FFFFFF1A"
    >
      <Div display="flex" justifyContent="space-between">
        <Span opacity="0.8">{label}</Span>
        {topContent === 'balance' ? (
          <InputFieldBalances name={name} />
        ) : (
          topContent
        )}
      </Div>
      <Div
        display="grid"
        maxWidth="100%"
        alignItems="center"
        fontFamily="JetBrains Mono"
        gridTemplateColumns="1fr auto"
      >
        <Input
          all="unset"
          color="#ffffff"
          placeholder="0"
          minWidth="100%"
          fontSize="1.5rem"
          autoComplete="off"
          disabled={disabled}
          {...register(`${name}.value`, {
            onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
              const value = parseInputEventToNumberString(event);
              const tokenType = getValues(`${name}.type`) as string;
              const token = Token.fromType(tokenType);
              setValue(`${name}.value`, value);
              setValue(
                `${name}.valueBN`,
                CurrencyAmount.fromHumanAmount(token, value || '0').raw
              );
            },
          })}
        />
        <InputFieldAsset
          name={name}
          types={types}
          oppositeName={oppositeName}
        />
      </Div>
      <Div display="flex" justifyContent="space-between">
        <InputFieldPrice name={name} />
        <InputFieldBalance name={name} />
      </Div>
    </Div>
  );
};

export default InputField;
