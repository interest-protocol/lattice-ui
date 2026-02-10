import { Button } from '@stylin.js/elements';
import type { FC } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { ACCENT, ACCENT_HOVER } from '@/constants/colors';

const SwapFormButton: FC = () => {
  const { control } = useFormContext();
  const fromValue = useWatch({ control, name: 'from.value' }) as string;
  const fromType = useWatch({ control, name: 'from.type' }) as string;
  const toType = useWatch({ control, name: 'to.type' }) as string;

  const isDisabled = !fromValue || Number.parseFloat(fromValue) <= 0;

  const handleSwap = () => {
    // TODO: Implement Wormhole bridge integration
    console.log(
      `Swapping ${fromValue} ${fromType.toUpperCase()} to ${toType.toUpperCase()}`
    );
  };

  return (
    <Button
      width="100%"
      py="1rem"
      px="1.5rem"
      bg={ACCENT}
      color="white"
      fontSize="1rem"
      fontWeight="600"
      borderRadius="0.75rem"
      border="none"
      cursor={isDisabled ? 'not-allowed' : 'pointer'}
      opacity={isDisabled ? 0.5 : 1}
      nHover={!isDisabled ? { bg: ACCENT_HOVER } : {}}
      onClick={handleSwap}
      disabled={isDisabled}
    >
      {isDisabled
        ? 'Enter amount'
        : `Swap ${fromType.toUpperCase()} to ${toType.toUpperCase()}`}
    </Button>
  );
};

export default SwapFormButton;
