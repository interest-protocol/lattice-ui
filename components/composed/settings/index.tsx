import { motion } from 'motion/react';
import type { FC } from 'react';

import PanelContent from '@/components/composed/panel-content';
import { BarsSVG, CogSVG } from '@/components/ui/icons';
import { useModal } from '@/hooks/store/use-modal';
import { useSidePanel } from '@/hooks/store/use-side-panel';

const COG_SPRING = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 20,
};

const Settings: FC = () => {
  const openPanel = useSidePanel((s) => s.open);
  const setModalContent = useModal((s) => s.setContent);

  const content = <PanelContent />;

  const handleDesktop = () => openPanel(content, { title: 'Settings' });
  const handleMobile = () => setModalContent(content, { title: 'Settings' });

  return (
    <div className="flex relative items-end flex-col">
      <button
        type="button"
        aria-label="Settings"
        className="text-text leading-none flex lg:hidden cursor-pointer items-center justify-center w-8 sm:w-auto h-8 sm:h-auto border border-accent-border rounded-lg sm:rounded-xl bg-transparent hover:bg-accent-muted hover:border-accent-border focus-ring"
        onClick={handleMobile}
      >
        <span className="p-1 transition-all duration-300">
          <BarsSVG maxWidth="1rem" maxHeight="1rem" width="100%" />
        </span>
      </button>
      <button
        type="button"
        aria-label="Settings"
        className="text-text leading-none hidden lg:flex cursor-pointer items-center justify-center border border-accent-border rounded-xl bg-transparent hover:bg-accent-muted hover:border-accent-border focus-ring"
        onClick={handleDesktop}
      >
        <motion.span
          className="p-2 sm:p-3 inline-block"
          whileHover={{ rotate: 90, scale: 1.05 }}
          transition={COG_SPRING}
        >
          <CogSVG maxWidth="1.5rem" maxHeight="1.5rem" width="100%" />
        </motion.span>
      </button>
    </div>
  );
};

export default Settings;
