import type { FC } from 'react';

import { CHAIN_KEYS, CHAIN_REGISTRY, type ChainKey } from '@/constants/chains';

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
          className="flex-1 p-3 flex items-center justify-center gap-2 cursor-pointer rounded-lg transition-all duration-200"
          style={{
            border: `2px solid ${isSelected ? color : '#FFFFFF1A'}`,
            background: isSelected ? `${color}1A` : 'transparent',
          }}
          onClick={() => setNetwork(net)}
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: `${color}33`, color }}
          >
            {displayName[0]}
          </div>
          <span className="text-white font-semibold text-sm">
            {displayName}
          </span>
        </button>
      );
    })}
  </div>
);

export default NetworkTabs;
