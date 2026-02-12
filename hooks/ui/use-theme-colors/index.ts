import { useTheme } from 'next-themes';

const getCssVar = (name: string): string =>
  typeof window === 'undefined'
    ? ''
    : getComputedStyle(document.documentElement).getPropertyValue(name).trim();

const useThemeColors = () => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== 'light';

  return {
    isDark,
    toast: {
      background: getCssVar('--color-toast-bg'),
      border: getCssVar('--color-toast-border'),
      shadow: getCssVar('--toast-shadow'),
    },
    skeleton: {
      baseColor: getCssVar('--color-skeleton-base'),
      highlightColor: getCssVar('--color-skeleton-highlight'),
    },
    particlePalette: [
      getCssVar('--particle-1'),
      getCssVar('--particle-2'),
      getCssVar('--particle-3'),
      getCssVar('--particle-4'),
      getCssVar('--particle-5'),
    ],
    particleStrokeRgb: getCssVar('--particle-stroke-rgb'),
  };
};

export default useThemeColors;
