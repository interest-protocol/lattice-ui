import type { FC, PropsWithChildren } from 'react';
import Footer from '@/components/composed/footer';
import Header from '@/components/composed/header';
import HealthIndicator from '@/components/composed/health-indicator';
import Background from '@/components/layout/background';

const Layout: FC<PropsWithChildren> = ({ children }) => (
  <main className="flex min-h-screen relative flex-col">
    <Background />
    <Header />
    {children}
    <Footer />
    <HealthIndicator />
  </main>
);
export default Layout;
