import type { FC } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import useBalances from '@/hooks/domain/use-balances';
import { FixedPointMath } from '@/lib/entities/fixed-point-math';
import { FACTOR_DIVISORS, PIZZA_ICONS } from './constants';
import type { InputFieldGenericProps } from './input-field.types';

const InputFieldBalances: FC<InputFieldGenericProps> = ({ name }) => {
  const { getBalance } = useBalances();
  const { control, setValue } = useFormContext();

  const type = useWatch({ control, name: `${name}.type` }) as string;
  const balance = getBalance(type);

  return (
    <div className="flex gap-1.5 items-center">
      {[0.25, 0.5, 1].map((factor) => {
        const Icon = PIZZA_ICONS[factor];
        const divisor = FACTOR_DIVISORS[factor];
        const scaled = balance / divisor;

        return (
          <button
            type="button"
            key={factor}
            aria-label={`Use ${factor * 100}% of balance`}
            className="flex gap-1.5 items-center cursor-pointer hover:text-accent hover:bg-accent-wash bg-transparent border-none rounded-md px-1.5 py-0.5 text-text-muted text-xs transition-colors duration-150 focus-ring"
            onClick={() => {
              setValue(`${name}.value`, FixedPointMath.toNumber(scaled));
              setValue(`${name}.valueBN`, scaled);
            }}
          >
            <span className="tabular-nums">{factor * 100}%</span>
            <Icon maxWidth="0.75rem" width="100%" />
          </button>
        );
      })}
    </div>
  );
};

export default InputFieldBalances;
