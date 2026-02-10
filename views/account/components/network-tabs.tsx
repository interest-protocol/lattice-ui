import { Button, Div, Span } from '@stylin.js/elements';
import type { FC } from 'react';

import { CHAIN_KEYS, CHAIN_REGISTRY, type ChainKey } from '@/constants/chains';

interface NetworkTabsProps {
  network: ChainKey;
  setNetwork: (network: ChainKey) => void;
}

const NetworkTabs: FC<NetworkTabsProps> = ({ network, setNetwork }) => (
  <Div display="flex" gap="0.5rem">
    {CHAIN_KEYS.map((net) => {
      const isSelected = net === network;
      const { color, displayName } = CHAIN_REGISTRY[net];

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
          border={`2px solid ${isSelected ? color : '#FFFFFF1A'}`}
          bg={isSelected ? `${color}1A` : 'transparent'}
          transition="all 0.2s ease"
          onClick={() => setNetwork(net)}
          nHover={{ bg: isSelected ? `${color}1A` : '#FFFFFF0D' }}
        >
          <Div
            width="1.5rem"
            height="1.5rem"
            borderRadius="50%"
            bg={`${color}33`}
            display="flex"
            alignItems="center"
            justifyContent="center"
            fontSize="0.75rem"
            fontWeight="700"
            color={color}
          >
            {displayName[0]}
          </Div>
          <Span color="#FFFFFF" fontWeight="600" fontSize="0.875rem">
            {displayName}
          </Span>
        </Button>
      );
    })}
  </Div>
);

export default NetworkTabs;
