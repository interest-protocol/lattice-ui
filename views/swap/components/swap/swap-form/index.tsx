import { SUI_TYPE_ARG } from '@mysten/sui/utils';
import { Div } from '@stylin.js/elements';
import { FC } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import InputField from '@/components/input-field';
import { SOL_TYPE } from '@/constants/coins';
import { ZERO_BIG_NUMBER } from '@/utils';

import SwapFormButton from './swap-form-button';

interface SwapFormValues {
  from: {
    type: string;
    value: string;
    valueBN: typeof ZERO_BIG_NUMBER;
  };
  to: {
    type: string;
    value: string;
    valueBN: typeof ZERO_BIG_NUMBER;
  };
}

const SwapForm: FC = () => {
  const form = useForm<SwapFormValues>({
    defaultValues: {
      from: {
        type: SUI_TYPE_ARG,
        value: '',
        valueBN: ZERO_BIG_NUMBER,
      },
      to: {
        type: SOL_TYPE,
        value: '',
        valueBN: ZERO_BIG_NUMBER,
      },
    },
  });

  return (
    <FormProvider {...form}>
      <Div
        display="flex"
        flexDirection="column"
        gap="1rem"
        p="1.5rem"
        bg="#FFFFFF0D"
        borderRadius="1rem"
      >
        <InputField
          name="from"
          label="From"
          types={[SUI_TYPE_ARG, SOL_TYPE]}
          topContent="balance"
        />

        <Div
          display="flex"
          justifyContent="center"
          alignItems="center"
          cursor="pointer"
          onClick={() => {
            const fromValue = form.getValues('from');
            const toValue = form.getValues('to');
            form.setValue('from', toValue);
            form.setValue('to', fromValue);
          }}
        >
          <Div
            width="2.5rem"
            height="2.5rem"
            borderRadius="50%"
            bg="#FFFFFF1A"
            display="flex"
            justifyContent="center"
            alignItems="center"
            nHover={{ bg: '#FFFFFF2A' }}
          >
            ↓↑
          </Div>
        </Div>

        <InputField
          name="to"
          label="To (estimated)"
          types={[SUI_TYPE_ARG, SOL_TYPE]}
          disabled
          topContent="balance"
        />

        <SwapFormButton />
      </Div>
    </FormProvider>
  );
};

export default SwapForm;
