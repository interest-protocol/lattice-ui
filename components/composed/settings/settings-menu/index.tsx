import { motion, useReducedMotion } from 'motion/react';
import { type FC, useState } from 'react';

import { Z_INDEX } from '@/constants/z-index';

import SettingsMenuExplorer from './settings-menu-explorer';
import SettingsMenuRPC from './settings-menu-rpc';
import SettingsMenuTheme from './settings-menu-theme';

const SettingsMenu: FC = () => {
  const [menu, setMenu] = useState<'theme' | 'explorer' | 'rpc' | null>(null);
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      className="gap-8 mt-[4.25rem] flex text-text overflow-hidden absolute rounded-2xl flex-col border border-surface-border"
      style={{
        zIndex: Z_INDEX.DROPDOWN,
        backdropFilter: `blur(var(--blur-lg))`,
        originY: 0,
        background: 'var(--color-surface-overlay)',
        boxShadow: 'var(--settings-shadow)',
      }}
      exit={reducedMotion ? { opacity: 0 } : { scaleY: 0, filter: 'blur(4px)' }}
      animate={
        reducedMotion
          ? { opacity: [0, 1] }
          : { scaleY: [0, 1], filter: ['blur(4px)', 'blur(0px)'] }
      }
    >
      <motion.div className="py-2 rounded-xl w-80">
        <SettingsMenuTheme
          show={menu === 'theme'}
          toggleShow={() => setMenu(menu === 'theme' ? null : 'theme')}
        />
        <hr className="border-b border-b-surface-border mx-4 border-t-0 border-x-0" />
        <SettingsMenuExplorer
          show={menu === 'explorer'}
          toggleShow={() => setMenu(menu === 'explorer' ? null : 'explorer')}
        />
        <hr className="border-b border-b-surface-border mx-4 border-t-0 border-x-0" />
        <SettingsMenuRPC
          show={menu === 'rpc'}
          toggleShow={() => setMenu(menu === 'rpc' ? null : 'rpc')}
        />
      </motion.div>
    </motion.div>
  );
};

export default SettingsMenu;
