import { AnimatePresence } from 'motion/react';
import { type FC, useState } from 'react';
import { BarsSVG, CogSVG } from '@/components/ui/icons';
import useClickOutsideListenerRef from '@/hooks/ui/use-click-outside-listener-ref';
import SettingsMenu from './settings-menu';

const Settings: FC = () => {
  const [show, setShow] = useState(false);

  const menuRef = useClickOutsideListenerRef<HTMLDivElement>(() =>
    setShow(false)
  );

  return (
    <div ref={menuRef} className="flex relative items-end flex-col">
      <button
        type="button"
        aria-label="Settings"
        aria-expanded={show}
        className="text-white leading-none flex cursor-pointer items-center justify-center w-8 sm:w-auto h-8 sm:h-auto border border-accent-4d rounded-lg sm:rounded-xl bg-transparent hover:bg-accent-80 hover:border-accent-4d"
        onClick={() => setShow((prev) => !prev)}
      >
        <span className="p-1 transition-all duration-300 lg:hidden">
          <BarsSVG maxWidth="1rem" maxHeight="1rem" width="100%" />
        </span>
        <span className="p-2 sm:p-3 transition-all duration-300 hidden lg:inline-block hover:rotate-90 hover:text-white">
          <CogSVG maxWidth="1.5rem" maxHeight="1.5rem" width="100%" />
        </span>
      </button>
      <AnimatePresence>{show && <SettingsMenu />}</AnimatePresence>
    </div>
  );
};

export default Settings;
