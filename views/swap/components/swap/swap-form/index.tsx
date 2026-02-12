import { SUI_TYPE_ARG } from '@mysten/sui/utils';
import type { FC } from 'react';
import { useEffect } from 'react';
import {
  FormProvider,
  useForm,
  useFormContext,
  useWatch,
} from 'react-hook-form';

import InputField from '@/components/composed/input-field';
import { SwapSVG } from '@/components/ui/icons';
import { SOL_TYPE } from '@/constants/coins';
import useTokenPrices from '@/hooks/blockchain/use-token-prices';
import { CurrencyAmount, Token, Trade } from '@/lib/entities';
import { ZERO_BIG_INT } from '@/utils';

import SwapFormButton from './swap-form-button';

interface SwapFormValues {
  from: {
    type: string;
    value: string;
    valueBN: bigint;
  };
  to: {
    type: string;
    value: string;
    valueBN: bigint;
  };
}

const SwapQuoteSync: FC = () => {
  const { control, setValue } = useFormContext<SwapFormValues>();
  const { getPrice } = useTokenPrices();

  const fromValue = useWatch({ control, name: 'from.value' });
  const fromType = useWatch({ control, name: 'from.type' });
  const toType = useWatch({ control, name: 'to.type' });

  useEffect(() => {
    if (!fromValue || Number(fromValue) === 0) {
      setValue('to.value', '');
      setValue('to.valueBN', ZERO_BIG_INT);
      return;
    }

    const inputPrice = getPrice(fromType);
    const outputPrice = getPrice(toType);

    if (!inputPrice || !outputPrice) return;

    const inputToken = Token.fromType(fromType);
    const outputToken = Token.fromType(toType);
    const inputAmount = CurrencyAmount.fromHumanAmount(inputToken, fromValue);

    const trade = Trade.fromOraclePrices({
      inputAmount,
      outputToken,
      inputPriceUsd: inputPrice,
      outputPriceUsd: outputPrice,
    });

    setValue('to.value', trade.minimumReceived.toSignificant(6));
    setValue('to.valueBN', trade.minimumReceived.raw);
  }, [fromValue, fromType, toType, getPrice, setValue]);

  return null;
};

const SwapForm: FC = () => {
  const form = useForm<SwapFormValues>({
    defaultValues: {
      from: {
        type: SUI_TYPE_ARG,
        value: '',
        valueBN: ZERO_BIG_INT,
      },
      to: {
        type: SOL_TYPE,
        value: '',
        valueBN: ZERO_BIG_INT,
      },
    },
  });

  return (
    <FormProvider {...form}>
      <SwapQuoteSync />
      <div
        className="flex flex-col gap-4 p-6 rounded-2xl border border-surface-border"
        style={{
          background: 'var(--card-bg)',
          boxShadow: 'var(--card-shadow)',
        }}
      >
        <InputField
          name="from"
          label="From"
          types={[SUI_TYPE_ARG, SOL_TYPE]}
          topContent="balance"
          oppositeName="to"
        />

        <button
          type="button"
          aria-label="Reverse swap direction"
          className="flex justify-center items-center cursor-pointer bg-transparent border-none p-0 self-center"
          onClick={() => {
            const fromValue = form.getValues('from');
            const toValue = form.getValues('to');
            form.setValue('from', toValue);
            form.setValue('to', fromValue);
          }}
        >
          <div
            className="w-10 h-10 rounded-full flex justify-center items-center text-text-secondary hover:text-text transition-colors duration-150"
            style={{
              background: 'var(--color-surface-light)',
              border: '1px solid var(--color-surface-border)',
            }}
          >
            <SwapSVG maxHeight="1rem" />
          </div>
        </button>

        <InputField
          name="to"
          label="To (estimated)"
          types={[SUI_TYPE_ARG, SOL_TYPE]}
          disabled
          topContent="balance"
          oppositeName="from"
        />

        <SwapFormButton />
      </div>
    </FormProvider>
  );
};

export default SwapForm;
