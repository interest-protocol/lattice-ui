import { Main } from '@stylin.js/elements';
import { type FC, type PropsWithChildren, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useBackgroundMotionTranslate } from '@/hooks/ui/use-background-motion-position';
import { useBackgroundTranslate } from '@/hooks/ui/use-background-position';

import Header from '@/components/composed/header';
import HealthIndicator from '@/components/composed/health-indicator';
import Background from '@/components/layout/background';

const Layout: FC<PropsWithChildren> = ({ children }) => {
  const { x, y } = useBackgroundMotionTranslate(
    useShallow((s) => ({ x: s.x, y: s.y }))
  );
  const setTranslate = useBackgroundTranslate((s) => s.setTranslate);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      setTranslate({ X: e.clientX, Y: e.clientY });
      x?.set(-(e.nativeEvent.x - window.innerWidth / 2) * 0.1);
      y?.set(-(e.nativeEvent.y - window.innerHeight / 2) * 0.1);
    },
    [setTranslate, x, y]
  );

  const handleMouseLeave = useCallback(() => {
    x?.set(0);
    y?.set(0);
  }, [x, y]);

  return (
    <Main
      display="flex"
      minHeight="100vh"
      position="relative"
      flexDirection="column"
      onMouseLeave={handleMouseLeave}
      onMouseMoveCapture={handleMouseMove}
    >
      <Background />
      <Header />
      {children}
      <HealthIndicator />
    </Main>
  );
};
export default Layout;
