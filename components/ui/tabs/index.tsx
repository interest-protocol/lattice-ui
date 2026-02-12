'use client';

import { motion, useReducedMotion } from 'motion/react';
import type { FC, ReactNode } from 'react';

import type { TabsProps } from './tabs.types';

const SPRING_TRANSITION = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30,
};
const INSTANT_TRANSITION = { duration: 0 };

const Tabs: FC<TabsProps> = ({ setTab, tab, tabs, id = 'tabs' }) => {
  const reducedMotion = useReducedMotion();

  return (
    <div className="flex border-b border-surface-border" role="tablist">
      {tabs.map((text, index) => {
        const isActive = tab === index;
        return (
          <button
            type="button"
            role="tab"
            key={text}
            id={`${id}-tab-${index}`}
            aria-selected={isActive}
            aria-controls={`${id}-tabpanel-${index}`}
            className={`relative py-3 px-4 cursor-pointer text-sm font-medium tracking-wide transition-colors duration-200 border-none bg-transparent focus-ring ${
              isActive ? 'text-accent' : 'text-text-secondary hover:text-text'
            }`}
            onClick={() => setTab(index)}
          >
            {text}
            {isActive && (
              <motion.span
                layoutId={`${id}-tab-indicator`}
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-accent"
                transition={
                  reducedMotion ? INSTANT_TRANSITION : SPRING_TRANSITION
                }
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

export const TabPanel: FC<{
  index: number;
  active: boolean;
  children: ReactNode;
  id?: string;
}> = ({ index, active, children, id = 'tabs' }) => (
  <div
    role="tabpanel"
    id={`${id}-tabpanel-${index}`}
    aria-labelledby={`${id}-tab-${index}`}
    hidden={!active}
  >
    {active ? children : null}
  </div>
);

export default Tabs;
