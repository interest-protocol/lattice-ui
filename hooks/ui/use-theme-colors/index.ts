import { useTheme } from 'next-themes';

const DARK_PARTICLE_PALETTE = [
  'rgba(14, 165, 233, 0.6)',
  'rgba(56, 189, 248, 0.5)',
  'rgba(125, 211, 252, 0.4)',
  'rgba(2, 132, 199, 0.5)',
  'rgba(186, 230, 253, 0.3)',
];

const LIGHT_PARTICLE_PALETTE = [
  'rgba(8, 145, 178, 0.4)',
  'rgba(14, 116, 144, 0.3)',
  'rgba(6, 182, 212, 0.3)',
  'rgba(22, 78, 99, 0.25)',
  'rgba(103, 232, 249, 0.2)',
];

const useThemeColors = () => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== 'light';

  return {
    isDark,
    toast: {
      background: isDark ? '#111827' : '#ffffff',
      border: isDark ? '#ffffff0d' : '#00000014',
      shadow: isDark
        ? '0 16px 48px rgba(0,0,0,0.4)'
        : '0 16px 48px rgba(0,0,0,0.1)',
    },
    skeleton: {
      baseColor: isDark ? '#FFFFFF0D' : '#0000000d',
      highlightColor: isDark ? '#FFFFFF1A' : '#00000014',
    },
    particlePalette: isDark ? DARK_PARTICLE_PALETTE : LIGHT_PARTICLE_PALETTE,
    particleStrokeRgb: isDark ? '14, 165, 233' : '8, 145, 178',
  };
};

export default useThemeColors;
