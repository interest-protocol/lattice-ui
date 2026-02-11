import { AnimatePresence, motion } from 'motion/react';
import type { FC } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { ChevronRightSVG } from '@/components/ui/icons';
import {
  EXPLORER_DISPLAY,
  EXPLORER_STORAGE_KEY,
  EXPLORERS,
  Explorer,
} from '@/constants';
import type { SettingsMenusProps } from './settings-menu.types';
import SettingsMenuItem from './settings-menu-item';

const SettingsMenuExplorer: FC<SettingsMenusProps> = ({ show, toggleShow }) => {
  const [localExplorer, setExplorer] = useLocalStorage<Explorer>(
    EXPLORER_STORAGE_KEY,
    Explorer.SuiVision
  );

  return (
    <div>
      <button
        type="button"
        className="px-4 py-2 flex cursor-pointer items-center justify-between bg-transparent border-none w-full text-inherit"
        onClick={toggleShow}
      >
        <p>Explorer</p>
        <motion.div animate={{ rotate: show ? '90deg' : '0deg' }}>
          <ChevronRightSVG
            width="100%"
            maxWidth="1.25rem"
            maxHeight="1.25rem"
          />
        </motion.div>
      </button>
      <AnimatePresence>
        {show ? (
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
            {EXPLORERS.map((explorer, index) => (
              <SettingsMenuItem
                key={explorer}
                name={explorer}
                withBorder={!!index}
                title={EXPLORER_DISPLAY[explorer]}
                selected={explorer === localExplorer}
                onSelect={() => setExplorer(explorer)}
              />
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default SettingsMenuExplorer;
