import { SUI_TYPE_ARG } from '@mysten/sui/utils';
import { Button, Div, Label, Span } from '@stylin.js/elements';
import type { FC } from 'react';

import { ASSET_METADATA, SOL_TYPE } from '@/constants/coins';

import type { BridgeNetworkSelectorProps, NetworkType } from './bridge.types';

const BridgeNetworkSelector: FC<BridgeNetworkSelectorProps> = ({
  sourceNetwork,
  setSourceNetwork,
}) => (
  <Div>
    <Label
      color="#FFFFFF80"
      fontSize="0.875rem"
      mb="0.5rem"
      display="block"
    >
      From Network
    </Label>
    <Div display="flex" gap="0.5rem">
      {(['sui', 'solana'] as const).map((net: NetworkType) => {
        const isSelected = net === sourceNetwork;
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
            {net === 'sui' && ASSET_METADATA[SUI_TYPE_ARG]?.iconUrl && (
              <img
                src={ASSET_METADATA[SUI_TYPE_ARG].iconUrl}
                alt="Sui"
                width="20"
                height="20"
                style={{ borderRadius: '50%' }}
              />
            )}
            {net === 'solana' && ASSET_METADATA[SOL_TYPE]?.iconUrl && (
              <img
                src={ASSET_METADATA[SOL_TYPE].iconUrl}
                alt="Solana"
                width="20"
                height="20"
                style={{ borderRadius: '50%' }}
              />
            )}
            <Span color="#FFFFFF" fontWeight="600">
              {net === 'sui' ? 'Sui' : 'Solana'}
            </Span>
          </Button>
        );
      })}
    </Div>
  </Div>
);

export default BridgeNetworkSelector;
