'use client';

import { motion } from 'motion/react';
import type { FC } from 'react';

import type { TabsProps } from './tabs.types';

const Tabs: FC<TabsProps> = ({ setTab, tab, tabs }) => (
  <div className="flex border-b border-surface-border" role="tablist">
    {tabs.map((text, index) => {
      const isActive = tab === index;
      return (
        <button
          type="button"
          role="tab"
          key={text}
          aria-selected={isActive}
          className={`relative py-3 px-4 cursor-pointer text-sm font-medium tracking-wide transition-colors duration-200 border-none bg-transparent ${
            isActive ? 'text-accent' : 'text-text-secondary hover:text-text'
          }`}
          onClick={() => setTab(index)}
        >
          {text}
          {isActive && (
            <motion.span
              layoutId="tab-indicator"
              className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-accent"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
        </button>
      );
    })}
  </div>
);

export default Tabs;
