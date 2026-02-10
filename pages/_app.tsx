import 'react-loading-skeleton/dist/skeleton.css';

import { Global } from '@emotion/react';
import { Analytics } from '@vercel/analytics/next';
import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import { Toaster } from 'react-hot-toast';
import { SkeletonTheme } from 'react-loading-skeleton';

import { BackgroundProvider } from '@/components';
import AppStateProvider from '@/components/app-state-provider';
import ModalProvider from '@/components/modal-provider';
import { TOAST_DURATION } from '@/constants/toast';
import { GlobalStyles } from '@/styles';

const PrivyProviderWrapper = dynamic(
  import('@/components/privy-provider').then((m) => m.default),
  { ssr: false }
);

const App = ({ Component, pageProps }: AppProps) => (
  <PrivyProviderWrapper>
    <Global styles={GlobalStyles} />
    <ModalProvider />
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: TOAST_DURATION,
        style: {
          zIndex: 100,
          maxWidth: '20rem',
          overflow: 'hidden',
          position: 'relative',
          background: '#242C32',
          boxShadow:
            '0px 16px 24px 0px rgba(0, 0, 0, 0.14), 0px 6px 30px 0px rgba(0, 0, 0, 0.12), 0px 8px 10px 0px rgba(0, 0, 0, 0.20)',
        },
      }}
    />
    <SkeletonTheme baseColor="#FFFFFF0D" highlightColor="#FFFFFF1A">
      <AppStateProvider />
      <BackgroundProvider />
      <Component {...pageProps} />
      <Analytics />
    </SkeletonTheme>
  </PrivyProviderWrapper>
);

export default App;
