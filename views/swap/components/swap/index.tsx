import type { FC } from 'react';

import SwapForm from './swap-form';

const Swap: FC = () => (
  <div className="flex flex-col gap-3 w-full max-w-[28rem] mx-auto">
    <SwapForm />
  </div>
);

export default Swap;
