import { Button, Span } from '@stylin.js/elements';
import type { FC } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import Skeleton from 'react-loading-skeleton';
import { useShallow } from 'zustand/react/shallow';

import { WalletSVG } from '@/components/ui/icons';
import { useAppState } from '@/hooks/store/use-app-state';
import { FixedPointMath } from '@/lib/entities/fixed-point-math';
import { ZERO_BIG_INT } from '@/utils';

import type { InputFieldGenericProps } from './input-field.types';

const InputFieldBalance: FC<InputFieldGenericProps> = ({ name }) => {
  const { control, setValue } = useFormContext();
  const { balances, loadingCoins, loadingObjects } = useAppState(
    useShallow((s) => ({
      balances: s.balances,
      loadingCoins: s.loadingCoins,
      loadingObjects: s.loadingObjects,
    }))
  );

  const type = useWatch({ control, name: `${name}.type` }) as string;

  const balance = balances[type];

  return (
    <Button
      all="unset"
      gap="0.5rem"
      display="flex"
      cursor="pointer"
      {...(name === 'in' && {
        nHover: { color: '#A78BFA' },
        onClick: () => {
          setValue(
            `${name}.value`,
            FixedPointMath.toNumber(balance ?? ZERO_BIG_INT)
          );
          setValue(`${name}.valueBN`, balance ?? ZERO_BIG_INT);
        },
      })}
    >
      <WalletSVG maxWidth="1rem" width="100%" />
      <Span fontFamily="JetBrains Mono">
        {loadingCoins || loadingObjects ? (
          <Skeleton width="2rem" />
        ) : (
          FixedPointMath.toNumber(balance ?? ZERO_BIG_INT)
        )}
      </Span>
    </Button>
  );
};

export default InputFieldBalance;
