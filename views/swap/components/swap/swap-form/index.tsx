import { SUI_TYPE_ARG } from '@mysten/sui/utils';
import type { FC } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import InputField from '@/components/composed/input-field';
import { SOL_TYPE } from '@/constants/coins';
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
      <div className="flex flex-col gap-4 p-6 bg-surface-light rounded-2xl">
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
          className="flex justify-center items-center cursor-pointer bg-transparent border-none p-0"
          onClick={() => {
            const fromValue = form.getValues('from');
            const toValue = form.getValues('to');
            form.setValue('from', toValue);
            form.setValue('to', fromValue);
          }}
        >
          <div className="w-10 h-10 rounded-full bg-surface-lighter flex justify-center items-center hover:bg-surface-hover">
            &#x2193;&#x2191;
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
