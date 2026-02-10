import { useSpring } from 'motion/react';
import { type FC, useEffect } from 'react';

import { useBackgroundMotionTranslate } from '@/hooks/use-background-motion-position';

const BackgroundProvider: FC = () => {
  const { setTranslate } = useBackgroundMotionTranslate();

  const x = useSpring(0);
  const y = useSpring(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: mount-only effect
  useEffect(() => {
    setTranslate({ x, y });
  }, []);

  return null;
};

export default BackgroundProvider;
