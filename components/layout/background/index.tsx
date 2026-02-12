import type { FC } from 'react';

import BackgroundBlur from './background-blur';
import BackgroundStatic from './background-static';

const Background: FC = () => (
  <>
    <BackgroundBlur />
    <BackgroundStatic />
  </>
);

export default Background;
