import { Div } from '@stylin.js/elements';
import { FC } from 'react';

import SwapDetails from './swap-details';
import SwapForm from './swap-form';

const Swap: FC = () => (
  <Div
    display="flex"
    flexDirection="column"
    gap="1.5rem"
    width="100%"
    maxWidth="40rem"
    mx="auto"
  >
    <SwapForm />
    <SwapDetails />
  </Div>
);

export default Swap;
