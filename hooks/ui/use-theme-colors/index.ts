import { useTheme } from 'next-themes';

const DARK_PARTICLE_PALETTE = [
  'rgba(167, 139, 250, 0.6)',
  'rgba(196, 181, 253, 0.5)',
  'rgba(221, 214, 254, 0.4)',
  'rgba(139, 92, 246, 0.5)',
  'rgba(237, 233, 254, 0.3)',
];

const LIGHT_PARTICLE_PALETTE = [
  'rgba(124, 58, 237, 0.4)',
  'rgba(109, 40, 217, 0.3)',
  'rgba(139, 92, 246, 0.3)',
  'rgba(91, 33, 182, 0.25)',
  'rgba(196, 181, 253, 0.2)',
];

const useThemeColors = () => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== 'light';

  return {
    isDark,
    toast: {
      background: isDark ? '#111827' : '#ffffff',
      border: isDark ? '#ffffff0d' : '#7c3aed22',
      shadow: isDark
        ? '0 16px 48px rgba(0,0,0,0.4)'
        : '0 0 0 1px rgba(124,58,237,0.08), 0 16px 48px rgba(0,0,0,0.12), 0 4px 16px rgba(124,58,237,0.06)',
    },
    skeleton: {
      baseColor: isDark ? '#FFFFFF0D' : '#7c3aed0d',
      highlightColor: isDark ? '#FFFFFF1A' : '#7c3aed1a',
    },
    particlePalette: isDark ? DARK_PARTICLE_PALETTE : LIGHT_PARTICLE_PALETTE,
    particleStrokeRgb: isDark ? '167, 139, 250' : '124, 58, 237',
  };
};

export default useThemeColors;
