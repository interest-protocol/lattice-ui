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
  error,
  variant = 'from',
}) => {
  const { register, setValue, getValues, control } = useFormContext();
  const watchedValue = useWatch({ control, name: `${name}.value` }) as string;

  const errorId = error ? `input-${name}-error` : undefined;

  const bgVar =
    variant === 'from' ? 'var(--input-from-bg)' : 'var(--input-to-bg)';

  return (
    <div
      className={`p-5 gap-3 flex text-text-secondary rounded-2xl text-sm flex-col transition-all duration-200 ${
        error ? 'ring-1 ring-error' : ''
      }`}
      style={{ background: bgVar }}
    >
      <div className="flex justify-between items-center">
        <label
          htmlFor={`input-${name}`}
          className="text-xs font-medium tracking-wider uppercase text-text-muted"
        >
          {label}
        </label>
        {!disabled && topContent === 'balance' ? (
          <InputFieldBalances name={name} />
        ) : !disabled ? (
          topContent
        ) : null}
      </div>
      <div className="grid max-w-full items-center gap-3 grid-cols-[1fr_auto]">
        {disabled ? (
          <span className="text-text text-4xl font-light tracking-tight min-w-full truncate">
            {watchedValue || '0'}
          </span>
        ) : (
          <input
            id={`input-${name}`}
            className="appearance-none bg-transparent border-none outline-none text-text min-w-full text-4xl font-light tracking-tight placeholder:text-text-dimmed"
            placeholder="0"
            autoComplete="off"
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={errorId}
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
      <div className="flex justify-between items-center text-xs">
        <InputFieldPrice name={name} />
        <InputFieldBalance name={name} />
      </div>
      {error && (
        <p id={errorId} className="text-error text-xs m-0" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default InputField;
