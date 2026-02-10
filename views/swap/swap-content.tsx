import { Div } from '@stylin.js/elements';
import { type FC, useState } from 'react';

import Tabs from '@/components/tabs';

import { Bridge, Swap } from './components';

const TABS = ['Swap', 'Bridge'] as const;

const SwapContent: FC = () => {
  const [tab, setTab] = useState(0);

  return (
    <Div
      flex="1"
      mx="auto"
      gap="1rem"
      display="flex"
      borderRadius="1rem"
      flexDirection="column"
      px={['0.5rem', '2rem']}
      width={['100%', '34rem']}
      my={['1rem', '1rem', '1rem', '1rem', '3rem']}
    >
      <Tabs tab={tab} setTab={setTab} tabs={TABS} />
      {tab === 0 && <Swap />}
      {tab === 1 && <Bridge />}
    </Div>
  );
};
export default SwapContent;
