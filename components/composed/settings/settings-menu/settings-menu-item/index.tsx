import { memo } from 'react';

import { ToggleButton } from '@/components/ui/toggle';

import type { SettingsMenuItemProps } from './settings-menu-item.types';

const SettingsMenuItem = memo<SettingsMenuItemProps>(
  ({ name, title, selected, onSelect, withBorder, tag }) => (
    <button
      type="button"
      className={`mx-4 py-2 flex justify-between bg-transparent border-none w-full text-inherit cursor-pointer ${withBorder ? 'border-t border-t-[#242424]' : ''}`}
      onClick={onSelect}
    >
      <span>
        {title}
        {tag && <small className="opacity-60"> ({tag})</small>}
      </span>
      <ToggleButton name={name} defaultValue={selected} onChange={onSelect} />
    </button>
  )
);

SettingsMenuItem.displayName = SettingsMenuItem.name;

export default SettingsMenuItem;
