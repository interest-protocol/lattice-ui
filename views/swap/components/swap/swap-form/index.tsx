import { SUI_TYPE_ARG } from '@mysten/sui/utils';
import { motion } from 'motion/react';
import type { FC } from 'react';
import { useEffect } from 'react';
import {
  FormProvider,
  useForm,
  useFormContext,
  useWatch,
} from 'react-hook-form';
import { useLocalStorage } from 'usehooks-ts';
import FlipButton from '@/components/composed/flip-button';
import InputField from '@/components/composed/input-field';
import { DEFAULT_SLIPPAGE_BPS, SLIPPAGE_STORAGE_KEY } from '@/constants';
import { SOL_TYPE } from '@/constants/coins';
import useTokenPrices from '@/hooks/blockchain/use-token-prices';
import { CurrencyAmount, Percent, Token, Trade } from '@/lib/entities';
import { ZERO_BIG_INT } from '@/utils';

import SwapDetails from '../swap-details';
import SwapFormButton from './swap-form-button';

const CARD_STYLE = {
  background: 'var(--swap-card-bg)',
  boxShadow: 'var(--swap-card-shadow)',
  border: '1px solid var(--swap-card-border)',
  backdropFilter: 'blur(24px) saturate(1.5)',
} as const;

const CARD_SPRING = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
  delay: 0.05,
};

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
  const [slippageBps] = useLocalStorage(
    SLIPPAGE_STORAGE_KEY,
    DEFAULT_SLIPPAGE_BPS
  );

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
      slippage: Percent.fromBps(slippageBps),
    });

    setValue('to.value', trade.minimumReceived.toSignificant(6));
    setValue('to.valueBN', trade.minimumReceived.raw);
  }, [fromValue, fromType, toType, getPrice, setValue, slippageBps]);

  return null;
};

const SwapForm: FC = () => {
  const form = useForm<SwapFormValues>({
    defaultValues: {
      from: {
        type: SOL_TYPE,
        value: '',
        valueBN: ZERO_BIG_INT,
      },
      to: {
        type: SUI_TYPE_ARG,
        value: '',
        valueBN: ZERO_BIG_INT,
      },
    },
  });

  return (
    <FormProvider {...form}>
      <SwapQuoteSync />
      <motion.div
        className="flex flex-col rounded-3xl relative"
        style={CARD_STYLE}
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={CARD_SPRING}
      >
        <div className="p-5 pb-4">
          <InputField
            name="from"
            label="You pay"
            variant="from"
            types={[SUI_TYPE_ARG, SOL_TYPE]}
            topContent="balance"
            oppositeName="to"
          />
        </div>

        <FlipButton
          ariaLabel="Reverse swap direction"
          onClick={() => {
            const fromValue = form.getValues('from');
            const toValue = form.getValues('to');
            form.setValue('from', toValue);
            form.setValue('to', fromValue);
          }}
        />

        <div className="p-5 pt-4">
          <InputField
            name="to"
            label="You receive"
            variant="to"
            types={[SUI_TYPE_ARG, SOL_TYPE]}
            disabled
            topContent="balance"
            oppositeName="from"
          />
        </div>

        <div className="px-5">
          <SwapDetails />
        </div>

        <div className="px-5 pb-5 pt-3">
          <SwapFormButton />
        </div>
      </motion.div>
    </FormProvider>
  );
};

export default SwapForm;
