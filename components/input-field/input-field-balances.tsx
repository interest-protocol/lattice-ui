import { Button, Div, Span } from '@stylin.js/elements';
import type { FC } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import {
  PizzaPart25PercentSVG,
  PizzaPart50PercentSVG,
  PizzaPart100PercentSVG,
} from '@/components/svg';
import { useAppState } from '@/hooks/use-app-state';
import { FixedPointMath } from '@/lib/entities/fixed-point-math';
import { ZERO_BIG_NUMBER } from '@/utils';

import type { SVGProps } from '../svg/svg.types';
import type { InputFieldGenericProps } from './input-field.types';

const PIZZA_ICONS: Record<0.25 | 0.5 | 1, FC<SVGProps>> = {
  0.25: PizzaPart25PercentSVG,
  0.5: PizzaPart50PercentSVG,
  1: PizzaPart100PercentSVG,
};

const InputFieldBalances: FC<InputFieldGenericProps> = ({ name }) => {
  const balances = useAppState((s) => s.balances);
  const { control, setValue } = useFormContext();

  const type = useWatch({ control, name: `${name}.type` }) as string;

  const balance = balances[type];

  return (
    <Div display="flex" gap="0.5rem">
      {[0.25, 0.5, 1].map((factor) => {
        const Icon = PIZZA_ICONS[factor as 0.25 | 0.5 | 1];

        return (
          <Button
            all="unset"
            gap="0.5rem"
            display="flex"
            key={factor}
            cursor="pointer"
            nHover={{ color: '#A78BFA' }}
            onClick={() => {
              setValue(
                `${name}.value`,
                FixedPointMath.toNumber(
                  balance?.times(factor) ?? ZERO_BIG_NUMBER
                )
              );
              setValue(
                `${name}.valueBN`,
                balance?.times(factor) ?? ZERO_BIG_NUMBER
              );
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
