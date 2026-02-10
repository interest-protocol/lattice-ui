import { Button, Div, Span } from '@stylin.js/elements';
import type { FC } from 'react';

type NetworkType = 'sui' | 'solana';

interface NetworkTabsProps {
  network: NetworkType;
  setNetwork: (network: NetworkType) => void;
}

const NETWORK_COLORS = {
  solana: '#9945FF',
  sui: '#4DA2FF',
} as const;

const NetworkTabs: FC<NetworkTabsProps> = ({ network, setNetwork }) => (
  <Div display="flex" gap="0.5rem">
    {(['solana', 'sui'] as const).map((net) => {
      const isSelected = net === network;
      const color = NETWORK_COLORS[net];

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
            {net === 'solana' ? 'S' : 'S'}
          </Div>
          <Span color="#FFFFFF" fontWeight="600" fontSize="0.875rem">
            {net === 'solana' ? 'Solana' : 'Sui'}
          </Span>
        </Button>
      );
    })}
  </Div>
);

export default NetworkTabs;
