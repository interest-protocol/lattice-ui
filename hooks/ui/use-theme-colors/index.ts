import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

const readCssVar = (name: string): string =>
  typeof window === 'undefined'
    ? ''
    : getComputedStyle(document.documentElement).getPropertyValue(name).trim();

interface ThemeColors {
  isDark: boolean;
  toast: {
    background: string;
    border: string;
    shadow: string;
  };
  skeleton: {
    baseColor: string;
    highlightColor: string;
  };
  particlePalette: string[];
  particleStrokeRgb: string;
}

const readAllColors = (isDark: boolean): ThemeColors => ({
  isDark,
  toast: {
    background: readCssVar('--color-toast-bg'),
    border: readCssVar('--color-toast-border'),
    shadow: readCssVar('--toast-shadow'),
  },
  skeleton: {
    baseColor: readCssVar('--color-skeleton-base'),
    highlightColor: readCssVar('--color-skeleton-highlight'),
  },
  particlePalette: [
    readCssVar('--particle-1'),
    readCssVar('--particle-2'),
    readCssVar('--particle-3'),
    readCssVar('--particle-4'),
    readCssVar('--particle-5'),
  ],
  particleStrokeRgb: readCssVar('--particle-stroke-rgb'),
});

const INITIAL_COLORS: ThemeColors = {
  isDark: true,
  toast: { background: '', border: '', shadow: '' },
  skeleton: { baseColor: '', highlightColor: '' },
  particlePalette: ['', '', '', '', ''],
  particleStrokeRgb: '',
};

const useThemeColors = () => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== 'light';
  const [colors, setColors] = useState<ThemeColors>(INITIAL_COLORS);

  useEffect(() => {
    // Small delay to ensure CSS variables are applied after theme switch
    const raf = requestAnimationFrame(() => {
      setColors(readAllColors(isDark));
    });
    return () => cancelAnimationFrame(raf);
  }, [resolvedTheme, isDark]);

  return colors;
};

export default useThemeColors;
