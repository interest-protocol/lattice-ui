import type { FC } from 'react';

import SwapDetails from './swap-details';
import SwapForm from './swap-form';

const Swap: FC = () => (
  <div className="flex flex-col gap-6 w-full max-w-[40rem] mx-auto">
    <SwapForm />
    <SwapDetails />
  </div>
);

export default Swap;
