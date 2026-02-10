import { motion } from 'motion/react';
import { type FC, useState } from 'react';

import SettingsMenuExplorer from './settings-menu-explorer';
import SettingsMenuRPC from './settings-menu-rpc';

const SettingsMenu: FC = () => {
  const [menu, setMenu] = useState<'explorer' | 'rpc' | null>(null);

  return (
    <motion.div
      className="gap-8 z-[1] mt-[4.25rem] bg-surface-light flex text-white overflow-hidden absolute rounded-2xl flex-col border border-surface-border"
      style={{ backdropFilter: 'blur(50px)', originY: 0 }}
      exit={{ scaleY: 0 }}
      animate={{ scaleY: [0, 1] }}
    >
      <motion.div className="py-2 rounded-xl w-80">
        <SettingsMenuExplorer
          show={menu === 'explorer'}
          toggleShow={() => setMenu(menu === 'explorer' ? null : 'explorer')}
        />
        <hr className="border-none border-b border-b-[#242424] mx-4" />
        <SettingsMenuRPC
          show={menu === 'rpc'}
          toggleShow={() => setMenu(menu === 'rpc' ? null : 'rpc')}
        />
      </motion.div>
    </motion.div>
  );
};

export default SettingsMenu;
