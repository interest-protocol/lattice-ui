import { AnimatePresence } from 'motion/react';
import { type FC, useEffect, useState } from 'react';
import Motion from '@/components/ui/motion';
import { TOAST_DURATION } from '@/constants/toast';
import type { ToastTimerProps } from './toast.types';

const ToastTimer: FC<ToastTimerProps> = ({ color, loading }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (loading) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / TOAST_DURATION) * 100);
      setProgress(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 100);

    return () => clearInterval(interval);
  }, [loading]);

  if (loading)
    return (
      <Motion
        style={{
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          position: 'absolute',
        }}
      >
        <Motion
          layout
          style={{ background: color, height: '0.15rem' }}
          initial={{ scaleX: 1 }}
          animate={{ scaleX: [0, 1] }}
          transition={{
            duration: 1,
            ease: 'linear',
            repeat: Number.POSITIVE_INFINITY,
            repeatType: 'mirror',
          }}
        />
      </Motion>
    );

  return (
    <AnimatePresence>
      <Motion
        style={{
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          position: 'absolute',
        }}
      >
        <Motion
          layout
          style={{ background: color, height: '0.15rem' }}
          initial={{ width: '100%' }}
          transition={{ duration: 0.1, ease: 'linear' }}
          animate={{ width: `${progress}%` }}
        />
      </Motion>
    </AnimatePresence>
  );
};

export default ToastTimer;
