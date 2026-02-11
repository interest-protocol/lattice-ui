'use client';

import { ThemeProvider as NextThemeProvider } from 'next-themes';
import type { FC, PropsWithChildren } from 'react';

import { THEME_STORAGE_KEY } from '@/constants/storage-keys';

const ThemeProvider: FC<PropsWithChildren> = ({ children }) => (
  <NextThemeProvider
    attribute="data-theme"
    defaultTheme="system"
    enableSystem
    disableTransitionOnChange
    storageKey={THEME_STORAGE_KEY}
  >
    {children}
  </NextThemeProvider>
);

export default ThemeProvider;
