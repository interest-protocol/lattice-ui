'use client';

import type { FC } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import SettingsMenuItem from '@/components/composed/settings/settings-menu/settings-menu-item';
import {
  EXPLORER_DISPLAY,
  EXPLORER_STORAGE_KEY,
  EXPLORERS,
  Explorer,
  SOLANA_EXPLORER_DISPLAY,
  SOLANA_EXPLORER_STORAGE_KEY,
  SOLANA_EXPLORERS,
  SolanaExplorer,
} from '@/constants';

import CollapsibleSection from './collapsible-section';

interface ExplorerSectionProps {
  show: boolean;
  toggleShow: () => void;
}

const ExplorerSection: FC<ExplorerSectionProps> = ({ show, toggleShow }) => {
  const [localExplorer, setExplorer] = useLocalStorage<Explorer>(
    EXPLORER_STORAGE_KEY,
    Explorer.SuiVision
  );

  const [localSolanaExplorer, setSolanaExplorer] =
    useLocalStorage<SolanaExplorer>(
      SOLANA_EXPLORER_STORAGE_KEY,
      SolanaExplorer.Solscan
    );

  return (
    <CollapsibleSection title="Explorer" show={show} toggleShow={toggleShow}>
      <span className="text-text-muted text-xs px-4 pt-1 block">Sui</span>
      {EXPLORERS.map((explorer, index) => (
        <SettingsMenuItem
          key={explorer}
          name={explorer}
          withBorder={!!index}
          title={EXPLORER_DISPLAY[explorer]}
          selected={explorer === localExplorer}
          onSelect={() => setExplorer(explorer)}
        />
      ))}
      <span className="text-text-muted text-xs px-4 pt-2 block">Solana</span>
      {SOLANA_EXPLORERS.map((explorer, index) => (
        <SettingsMenuItem
          key={explorer}
          name={explorer}
          withBorder={!!index}
          title={SOLANA_EXPLORER_DISPLAY[explorer]}
          selected={explorer === localSolanaExplorer}
          onSelect={() => setSolanaExplorer(explorer)}
        />
      ))}
    </CollapsibleSection>
  );
};

export default ExplorerSection;
