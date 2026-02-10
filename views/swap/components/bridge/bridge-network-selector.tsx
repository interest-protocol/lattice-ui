import { Button, Div, Label, Span } from '@stylin.js/elements';
import type { FC } from 'react';

import { CHAIN_KEYS, CHAIN_REGISTRY } from '@/constants/chains';

import type { BridgeNetworkSelectorProps } from './bridge.types';

const BridgeNetworkSelector: FC<BridgeNetworkSelectorProps> = ({
  sourceNetwork,
  setSourceNetwork,
}) => (
  <Div>
    <Label color="#FFFFFF80" fontSize="0.875rem" mb="0.5rem" display="block">
      From Network
    </Label>
    <Div display="flex" gap="0.5rem">
      {CHAIN_KEYS.map((net) => {
        const isSelected = net === sourceNetwork;
        const config = CHAIN_REGISTRY[net];
        return (
          <Button
            key={net}
            all="unset"
            flex="1"
            p="0.75rem"
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap="0.5rem"
            cursor="pointer"
            borderRadius="0.5rem"
            border={`1px solid ${isSelected ? '#A78BFA' : '#FFFFFF1A'}`}
            bg={isSelected ? '#A78BFA1A' : '#FFFFFF0D'}
            onClick={() => setSourceNetwork(net)}
            nHover={{ bg: isSelected ? '#A78BFA1A' : '#FFFFFF1A' }}
          >
            {config.nativeToken?.iconUrl && (
              <img
                src={config.nativeToken.iconUrl}
                alt={config.displayName}
                width="20"
                height="20"
                style={{ borderRadius: '50%' }}
              />
            )}
            <Span color="#FFFFFF" fontWeight="600">
              {config.displayName}
            </Span>
          </Button>
        );
      })}
    </Div>
  </Div>
);

export default BridgeNetworkSelector;
