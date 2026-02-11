'use client';

import type { FC } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import SettingsMenuItem from '@/components/composed/settings/settings-menu/settings-menu-item';
import { RPC, RPC_DISPLAY, RPC_STORAGE_KEY, RPCs } from '@/constants';

import CollapsibleSection from './collapsible-section';

interface RpcSectionProps {
  show: boolean;
  toggleShow: () => void;
}

const RpcSection: FC<RpcSectionProps> = ({ show, toggleShow }) => {
  const [localRPC, setRPC] = useLocalStorage<RPC>(RPC_STORAGE_KEY, RPC.Shinami);

  return (
    <CollapsibleSection title="RPC" show={show} toggleShow={toggleShow}>
      {RPCs.map((rpc, index) => (
        <SettingsMenuItem
          key={rpc}
          name={rpc}
          withBorder={!!index}
          title={RPC_DISPLAY[rpc]}
          selected={rpc === localRPC}
          onSelect={() => setRPC(rpc)}
          tag={rpc === RPC.Shinami ? 'Recommended' : null}
        />
      ))}
    </CollapsibleSection>
  );
};

export default RpcSection;
