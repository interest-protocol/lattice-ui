import Image from 'next/image';
import type { FC } from 'react';

import { CHAIN_KEYS, CHAIN_REGISTRY } from '@/constants/chains';

import type { BridgeNetworkSelectorProps } from './bridge.types';

const BridgeNetworkSelector: FC<BridgeNetworkSelectorProps> = ({
  sourceNetwork,
  setSourceNetwork,
}) => (
  <div>
    <span className="text-text-muted text-sm mb-2 block">From Network</span>
    <div className="flex gap-2">
      {CHAIN_KEYS.map((net) => {
        const isSelected = net === sourceNetwork;
        const config = CHAIN_REGISTRY[net];
        return (
          <button
            key={net}
            type="button"
            className="flex-1 p-3 flex items-center justify-center gap-2 cursor-pointer rounded-lg border-none"
            style={{
              border: `1px solid ${isSelected ? '#A78BFA' : '#FFFFFF1A'}`,
              background: isSelected ? '#A78BFA1A' : '#FFFFFF0D',
            }}
            onClick={() => setSourceNetwork(net)}
          >
            {config.nativeToken?.iconUrl && (
              <Image
                src={config.nativeToken.iconUrl}
                alt={config.displayName}
                width={20}
                height={20}
                style={{ borderRadius: '50%' }}
              />
            )}
            <span className="text-white font-semibold">
              {config.displayName}
            </span>
          </button>
        );
      })}
    </div>
  </div>
);

export default BridgeNetworkSelector;
