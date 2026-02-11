import type { FC } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

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
  const { register, setValue, getValues, control } = useFormContext();
  const watchedValue = useWatch({ control, name: `${name}.value` }) as string;

  return (
    <div
      className={`p-4 gap-3 flex text-text-secondary rounded-xl text-sm flex-col border border-surface-border transition-all duration-200 ${disabled ? '' : 'focus-within:border-accent-border'}`}
      style={{ background: 'var(--color-surface-inset)' }}
    >
      <div className="flex justify-between">
        <label htmlFor={`input-${name}`} className="opacity-80">
          {label}
        </label>
        {!disabled && topContent === 'balance' ? (
          <InputFieldBalances name={name} />
        ) : !disabled ? (
          topContent
        ) : null}
      </div>
      <div className="grid max-w-full items-center font-mono grid-cols-[1fr_auto]">
        {disabled ? (
          <span className="text-text text-2xl min-w-full truncate">
            {watchedValue || '0'}
          </span>
        ) : (
          <input
            id={`input-${name}`}
            className="appearance-none bg-transparent border-none outline-none text-text min-w-full text-2xl"
            placeholder="0"
            autoComplete="off"
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
        )}
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
