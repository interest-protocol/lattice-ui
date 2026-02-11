import type { FC } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import Skeleton from 'react-loading-skeleton';

import { WalletSVG } from '@/components/ui/icons';
import useBalances from '@/hooks/domain/use-balances';
import { FixedPointMath } from '@/lib/entities/fixed-point-math';

import type { InputFieldGenericProps } from './input-field.types';

const InputFieldBalance: FC<InputFieldGenericProps> = ({ name }) => {
  const { control, setValue } = useFormContext();
  const { getBalance, isLoading } = useBalances();

  const type = useWatch({ control, name: `${name}.type` }) as string;
  const balance = getBalance(type);

  return (
    <button
      type="button"
      className={`flex gap-2 cursor-pointer bg-transparent border-none p-0 text-inherit ${name === 'in' ? 'hover:text-accent' : ''}`}
      {...(name === 'in' && {
        onClick: () => {
          setValue(`${name}.value`, FixedPointMath.toNumber(balance));
          setValue(`${name}.valueBN`, balance);
        },
      })}
    >
      <WalletSVG maxWidth="1rem" width="100%" />
      <span className="font-mono">
        {isLoading ? (
          <Skeleton width="2rem" />
        ) : (
          FixedPointMath.toNumber(balance)
        )}
      </span>
    </button>
  );
};

export default InputFieldBalance;
