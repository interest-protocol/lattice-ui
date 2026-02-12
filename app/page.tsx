import { Suspense } from 'react';

import Home from '@/views/swap';

const HomePage = () => (
  <Suspense>
    <Home />
  </Suspense>
);

export default HomePage;
