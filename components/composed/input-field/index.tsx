import type { FC } from 'react';
import { useFormContext } from 'react-hook-form';

import { CurrencyAmount, Token } from '@/lib/entities';
import { parseInputEventToNumberString } from '@/utils';
import type { InputFieldProps } from './input-field.types';
import InputFieldAsset from './input-field-asset';
import InputFieldBalance from './input-field-balance';
import InputFieldBalances from './input-field-balances';
import InputFieldPrice from './input-field-price';

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
    <div
      className="p-4 gap-3 flex text-text-secondary rounded-xl text-sm flex-col border border-surface-border transition-all duration-200 focus-within:border-accent-border"
      style={{ background: 'var(--color-surface-inset)' }}
    >
      <div className="flex justify-between">
        <label htmlFor={`input-${name}`} className="opacity-80">
          {label}
        </label>
        {topContent === 'balance' ? (
          <InputFieldBalances name={name} />
        ) : (
          topContent
        )}
      </div>
      <div className="grid max-w-full items-center font-mono grid-cols-[1fr_auto]">
        <input
          id={`input-${name}`}
          className="appearance-none bg-transparent border-none outline-none text-text min-w-full text-2xl"
          placeholder="0"
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
      </div>
      <div className="flex justify-between">
        <InputFieldPrice name={name} />
        <InputFieldBalance name={name} />
      </div>
    </div>
  );
};

export default InputField;
