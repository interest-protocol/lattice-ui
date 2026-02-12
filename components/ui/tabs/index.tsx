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
    <div
      className="flex p-1 rounded-xl border border-surface-border"
      style={{ background: 'var(--color-surface-light)' }}
      role="tablist"
    >
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
            className={`relative py-2.5 px-4 flex-1 cursor-pointer text-sm font-medium tracking-wide border-none bg-transparent focus-ring rounded-lg ${
              isActive ? 'text-text' : 'text-text-secondary hover:text-text'
            }`}
            onClick={() => setTab(index)}
          >
            {isActive && (
              <motion.span
                layoutId={`${id}-tab-indicator`}
                className="absolute inset-0 rounded-lg"
                style={{
                  background: 'var(--color-surface-overlay)',
                  boxShadow: '0 1px 0 0 rgba(255,255,255,0.06) inset',
                }}
                transition={
                  reducedMotion ? INSTANT_TRANSITION : SPRING_TRANSITION
                }
              />
            )}
            <span className="relative z-10">{text}</span>
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
