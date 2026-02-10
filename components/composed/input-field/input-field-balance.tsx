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
    <button
      type="button"
      className={`flex gap-2 cursor-pointer bg-transparent border-none p-0 text-inherit ${name === 'in' ? 'hover:text-accent' : ''}`}
      {...(name === 'in' && {
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
      <span className="font-mono">
        {loadingCoins || loadingObjects ? (
          <Skeleton width="2rem" />
        ) : (
          FixedPointMath.toNumber(balance ?? ZERO_BIG_INT)
        )}
      </span>
    </button>
  );
};

export default InputFieldBalance;
