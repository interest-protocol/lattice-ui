import type { FC } from 'react';

import type { TabsProps } from './tabs.types';

const Tabs: FC<TabsProps> = ({ setTab, tab, tabs }) => (
  <div className="flex gap-2">
    {tabs.map((text, index) => (
      <button
        type="button"
        key={text}
        className={`py-2 px-3 cursor-pointer border rounded-xl ${
          tab === index
            ? 'text-[#292929] bg-accent border-accent'
            : 'text-white bg-transparent border-accent-4d'
        }`}
        onClick={() => setTab(index)}
      >
        {text}
      </button>
    ))}
  </div>
);

export default Tabs;
