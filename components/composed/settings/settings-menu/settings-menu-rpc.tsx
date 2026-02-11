import { AnimatePresence, motion } from 'motion/react';
import type { FC } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { ChevronRightSVG } from '@/components/ui/icons';
import { RPC, RPC_DISPLAY, RPC_STORAGE_KEY, RPCs } from '@/constants';
import type { SettingsMenusProps } from './settings-menu.types';
import SettingsMenuItem from './settings-menu-item';

const SettingsMenuRPC: FC<SettingsMenusProps> = ({ show, toggleShow }) => {
  const [localRPC, setRPC] = useLocalStorage<RPC>(RPC_STORAGE_KEY, RPC.Shinami);

  return (
    <div>
      <button
        type="button"
        className="px-4 py-2 flex cursor-pointer items-center justify-between bg-transparent border-none w-full text-inherit"
        onClick={toggleShow}
      >
        <p>RPCs</p>
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
            {RPCs.map((rpc, index) => (
              <SettingsMenuItem
                key={rpc}
                name={rpc}
                withBorder={!!index}
                title={RPC_DISPLAY[rpc]}
                selected={rpc === localRPC}
                onSelect={() => setRPC(rpc)}
                tag={rpc === RPC.Shinami ? 'Recommended' : null}
              />
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default SettingsMenuRPC;
