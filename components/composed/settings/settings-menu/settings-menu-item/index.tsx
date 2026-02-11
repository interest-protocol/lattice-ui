import type { FC } from 'react';

import { ToggleButton } from '@/components/ui/toggle';

import type { SettingsMenuItemProps } from './settings-menu-item.types';

const SettingsMenuItem: FC<SettingsMenuItemProps> = ({
  name,
  title,
  selected,
  onSelect,
  withBorder,
  tag,
}) => (
  <div
    className={`mx-4 py-2 flex justify-between items-center ${withBorder ? 'border-t border-t-surface-separator' : ''}`}
  >
    <span>
      {title}
      {tag && <small className="opacity-60"> ({tag})</small>}
    </span>
    <ToggleButton name={name} defaultValue={selected} onChange={onSelect} />
  </div>
);

export default SettingsMenuItem;
