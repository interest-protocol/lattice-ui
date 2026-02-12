import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
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
}) => {
  const reducedMotion = useReducedMotion();

  return (
    <div>
      <button
        type="button"
        aria-expanded={show}
        className="px-4 py-2 flex cursor-pointer items-center justify-between bg-transparent border-none w-full text-inherit focus-ring rounded"
        onClick={toggleShow}
      >
        <p>{title}</p>
        <motion.div
          animate={{ rotate: show ? '90deg' : '0deg' }}
          transition={reducedMotion ? { duration: 0 } : undefined}
        >
          <ChevronRightSVG
            width="100%"
            maxWidth="1.25rem"
            maxHeight="1.25rem"
          />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {show ? (
          <motion.div
            className="ml-6"
            style={{ originY: 0 }}
            exit={
              reducedMotion
                ? { opacity: 0 }
                : { scaleY: 0, height: 0, opacity: 0 }
            }
            animate={
              reducedMotion
                ? { opacity: 1 }
                : {
                    scaleY: [0, 1],
                    height: [0, 'auto'],
                    opacity: [0, 1, 1],
                  }
            }
          >
            {children}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default CollapsibleSection;
