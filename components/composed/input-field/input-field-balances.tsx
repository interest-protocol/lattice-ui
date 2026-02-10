import { Button, Div, Span } from '@stylin.js/elements';
import type { FC } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import {
  PizzaPart25PercentSVG,
  PizzaPart50PercentSVG,
  PizzaPart100PercentSVG,
} from '@/components/ui/icons';
import type { SVGProps } from '@/components/ui/icons/icons.types';
import { useAppState } from '@/hooks/store/use-app-state';
import { FixedPointMath } from '@/lib/entities/fixed-point-math';
import { ZERO_BIG_INT } from '@/utils';
import type { InputFieldGenericProps } from './input-field.types';

const PIZZA_ICONS: Record<number, FC<SVGProps>> = {
  0.25: PizzaPart25PercentSVG,
  0.5: PizzaPart50PercentSVG,
  1: PizzaPart100PercentSVG,
};

const FACTOR_DIVISORS: Record<number, bigint> = {
  0.25: 4n,
  0.5: 2n,
  1: 1n,
};

const InputFieldBalances: FC<InputFieldGenericProps> = ({ name }) => {
  const balances = useAppState((s) => s.balances);
  const { control, setValue } = useFormContext();

  const type = useWatch({ control, name: `${name}.type` }) as string;

  const balance = balances[type] ?? ZERO_BIG_INT;

  return (
    <Div display="flex" gap="0.5rem">
      {[0.25, 0.5, 1].map((factor) => {
        const Icon = PIZZA_ICONS[factor];
        const divisor = FACTOR_DIVISORS[factor];
        const scaled = balance / divisor;

        return (
          <Button
            all="unset"
            gap="0.5rem"
            display="flex"
            key={factor}
            cursor="pointer"
            nHover={{ color: '#A78BFA' }}
            onClick={() => {
              setValue(`${name}.value`, FixedPointMath.toNumber(scaled));
              setValue(`${name}.valueBN`, scaled);
            }}
          >
            <Span fontFamily="JetBrains Mono">{factor * 100}%</Span>
            <Icon maxWidth="1rem" width="100%" />
          </Button>
        );
      })}
    </Div>
  );
};

export default InputFieldBalances;
