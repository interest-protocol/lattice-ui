import type { FC } from 'react';

import {
  PizzaPart25PercentSVG,
  PizzaPart50PercentSVG,
  PizzaPart100PercentSVG,
} from '@/components/ui/icons';
import type { SVGProps } from '@/components/ui/icons/icons.types';

export const PIZZA_ICONS: Record<number, FC<SVGProps>> = {
  0.25: PizzaPart25PercentSVG,
  0.5: PizzaPart50PercentSVG,
  1: PizzaPart100PercentSVG,
};

export const FACTOR_DIVISORS: Record<number, bigint> = {
  0.25: 4n,
  0.5: 2n,
  1: 1n,
};
