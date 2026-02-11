import { AnimatePresence, motion } from 'motion/react';
import type { FC, ReactNode } from 'react';

import { ChevronRightSVG } from '@/components/ui/icons';

interface CollapsibleSectionProps {
  title: string;
  show: boolean;
  toggleShow: () => void;
  children: ReactNode;
}

const CollapsibleSection: FC<CollapsibleSectionProps> = ({
  title,
  show,
  toggleShow,
  children,
}) => (
  <div>
    <button
      type="button"
      className="px-4 py-2 flex cursor-pointer items-center justify-between bg-transparent border-none w-full text-inherit"
      onClick={toggleShow}
    >
      <p>{title}</p>
      <motion.div animate={{ rotate: show ? '90deg' : '0deg' }}>
        <ChevronRightSVG width="100%" maxWidth="1.25rem" maxHeight="1.25rem" />
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
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export default CollapsibleSection;
