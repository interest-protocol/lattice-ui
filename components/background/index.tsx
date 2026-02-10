import { AnimatePresence } from 'motion/react';
import { FC } from 'react';

import BackgroundBlur from './background-blur';
import BackgroundParticles from './background-particles';

const Background: FC = () => (
  <AnimatePresence>
    <BackgroundBlur key="blur" />
    <BackgroundParticles key="particles" />
  </AnimatePresence>
);

export default Background;
