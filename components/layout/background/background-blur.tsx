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
          'radial-gradient(ellipse at 50% 0%, #6366f108 0%, transparent 60%), linear-gradient(180deg, rgba(10,14,26,0.75), rgba(10,14,26,0.95)), url(/bg.png)',
        backgroundPosition: 'top left',
        backgroundSize: 'cover',
      }}
    />
  );
};

export default BackgroundBlur;
