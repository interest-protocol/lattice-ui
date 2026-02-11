'use client';

import { useTheme } from 'next-themes';
import type { FC } from 'react';

import SettingsMenuItem from '@/components/composed/settings/settings-menu/settings-menu-item';

import CollapsibleSection from './collapsible-section';

const THEMES = ['system', 'dark', 'light'] as const;

const THEME_DISPLAY: Record<(typeof THEMES)[number], string> = {
  system: 'System',
  dark: 'Dark',
  light: 'Light',
};

interface ThemeSectionProps {
  show: boolean;
  toggleShow: () => void;
}

const ThemeSection: FC<ThemeSectionProps> = ({ show, toggleShow }) => {
  const { theme, setTheme } = useTheme();

  return (
    <CollapsibleSection title="Theme" show={show} toggleShow={toggleShow}>
      {THEMES.map((t, index) => (
        <SettingsMenuItem
          key={t}
          name={t}
          withBorder={!!index}
          title={THEME_DISPLAY[t]}
          selected={t === theme}
          onSelect={() => setTheme(t)}
        />
      ))}
    </CollapsibleSection>
  );
};

export default ThemeSection;
