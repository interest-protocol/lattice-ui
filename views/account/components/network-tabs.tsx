import Image from 'next/image';
import type { FC } from 'react';

import { CHAIN_KEYS, CHAIN_REGISTRY, type ChainKey } from '@/constants/chains';

const CHAIN_LOGO: Record<ChainKey, string> = {
  sui: '/sui-logo.svg',
  solana: '/sol-logo.svg',
};

interface NetworkTabsProps {
  network: ChainKey;
  setNetwork: (network: ChainKey) => void;
}

const NetworkTabs: FC<NetworkTabsProps> = ({ network, setNetwork }) => (
  <div className="flex gap-2" role="tablist">
    {CHAIN_KEYS.map((net) => {
      const isSelected = net === network;
      const { color, displayName } = CHAIN_REGISTRY[net];

      return (
        <button
          key={net}
          type="button"
          role="tab"
          aria-selected={isSelected}
          className="flex-1 p-3 flex items-center justify-center gap-2 cursor-pointer rounded-xl hover:bg-surface-hover transition-all duration-200"
          style={{
            border: `2px solid ${isSelected ? color : 'var(--color-surface-border)'}`,
            background: isSelected ? `${color}1A` : undefined,
          }}
          onClick={() => setNetwork(net)}
        >
          <Image
            src={CHAIN_LOGO[net]}
            alt={displayName}
            width={22}
            height={22}
          />
          <span className="text-text font-semibold text-sm">{displayName}</span>
        </button>
      );
    })}
  </div>
);

export default NetworkTabs;
