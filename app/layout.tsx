import 'react-loading-skeleton/dist/skeleton.css';
import './globals.css';

import { Analytics } from '@vercel/analytics/next';
import type { Metadata, Viewport } from 'next';
import { DM_Sans, JetBrains_Mono } from 'next/font/google';
import type { ReactNode } from 'react';

import Providers from './providers';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Lattice',
  icons: { icon: '/icon.svg' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

const RootLayout = ({ children }: { children: ReactNode }) => (
  <html lang="en" className={`${dmSans.variable} ${jetbrainsMono.variable}`}>
    <body>
      <Providers>{children}</Providers>
      <Analytics />
    </body>
  </html>
);

export default RootLayout;
