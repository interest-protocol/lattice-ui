import type { FC } from 'react';
import { useShallow } from 'zustand/react/shallow';
import Motion from '@/components/ui/motion';
import { useBackgroundMotionTranslate } from '@/hooks/ui/use-background-motion-position';

const BackgroundBlur: FC = () => {
  const { x, y } = useBackgroundMotionTranslate(
    useShallow((s) => ({ x: s.x, y: s.y }))
  );

  return (
    <Motion
      transition={{ ease: 'linear' }}
      style={{
        x,
        y,
        originX: 'center',
        originY: 'center',
        inset: 0,
        zIndex: -1,
        scale: 1.5,
        position: 'fixed',
        filter: 'blur(50px)',
        background:
          'linear-gradient(180deg, #000000AA,#000000EE), url(/bg.png)',
        backgroundPosition: 'top left',
        backgroundSize: 'cover',
      }}
    />
  );
};

export default BackgroundBlur;
