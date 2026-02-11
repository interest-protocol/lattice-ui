import { AnimatePresence, motion } from 'motion/react';
import { useTheme } from 'next-themes';
import type { FC } from 'react';

import { ChevronRightSVG } from '@/components/ui/icons';
import type { SettingsMenusProps } from './settings-menu.types';
import SettingsMenuItem from './settings-menu-item';

const THEMES = ['system', 'dark', 'light'] as const;

const THEME_DISPLAY: Record<(typeof THEMES)[number], string> = {
  system: 'System',
  dark: 'Dark',
  light: 'Light',
};

const SettingsMenuTheme: FC<SettingsMenusProps> = ({ show, toggleShow }) => {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <button
        type="button"
        className="px-4 py-2 flex cursor-pointer items-center justify-between bg-transparent border-none w-full text-inherit"
        onClick={toggleShow}
      >
        <p>Theme</p>
        <motion.div animate={{ rotate: show ? '90deg' : '0deg' }}>
          <ChevronRightSVG
            width="100%"
            maxWidth="1.25rem"
            maxHeight="1.25rem"
          />
        </motion.div>
      </button>
      <AnimatePresence>
        {show && (
          <motion.div
            className="ml-6"
            style={{ originY: 0 }}
            exit={{ scaleY: 0, height: 0, opacity: 0 }}
            animate={{
              scaleY: [0, 1],
              height: [0, 'auto'],
              opacity: [0, 1, 1],
            }}
          >
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsMenuTheme;
