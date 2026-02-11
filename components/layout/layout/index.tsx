import type { FC, PropsWithChildren } from 'react';
import { useShallow } from 'zustand/react/shallow';
import Footer from '@/components/composed/footer';
import Header from '@/components/composed/header';
import HealthIndicator from '@/components/composed/health-indicator';
import Background from '@/components/layout/background';
import { useBackgroundMotionTranslate } from '@/hooks/ui/use-background-motion-position';
import { useBackgroundTranslate } from '@/hooks/ui/use-background-position';

const Layout: FC<PropsWithChildren> = ({ children }) => {
  const { x, y } = useBackgroundMotionTranslate(
    useShallow((s) => ({ x: s.x, y: s.y }))
  );
  const setTranslate = useBackgroundTranslate((s) => s.setTranslate);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    setTranslate({ X: e.clientX, Y: e.clientY });
    x?.set(-(e.nativeEvent.x - window.innerWidth / 2) * 0.1);
    y?.set(-(e.nativeEvent.y - window.innerHeight / 2) * 0.1);
  };

  const handleMouseLeave = () => {
    x?.set(0);
    y?.set(0);
  };

  return (
    <main
      className="flex min-h-screen relative flex-col"
      onMouseLeave={handleMouseLeave}
      onMouseMoveCapture={handleMouseMove}
    >
      <Background />
      <Header />
      {children}
      <Footer />
      <HealthIndicator />
    </main>
  );
};
export default Layout;
