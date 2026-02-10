import { SUI_TYPE_ARG } from '@mysten/sui/utils';
import { Button, Div, Input, Label, Span } from '@stylin.js/elements';
import type { FC } from 'react';

import { ASSET_METADATA, SOL_TYPE } from '@/constants/coins';

import BridgeButton from './bridge-button';
import BridgeNetworkSelector from './bridge-network-selector';
import type { BridgeFormProps, TokenKey } from './bridge.types';

const TOKEN_OPTIONS_LIST: {
  key: TokenKey;
  iconUrl?: string;
  symbol: string;
}[] = [
  { key: 'SUI', iconUrl: ASSET_METADATA[SUI_TYPE_ARG]?.iconUrl, symbol: 'SUI' },
  { key: 'SOL', iconUrl: ASSET_METADATA[SOL_TYPE]?.iconUrl, symbol: 'SOL' },
];

const BridgeForm: FC<BridgeFormProps> = ({
  sourceNetwork,
  setSourceNetwork,
  selectedToken,
  setSelectedToken,
  amount,
  setAmount,
  isDisabled,
  isLoading,
  status,
  validationMessage,
  destNetwork,
  token,
  balanceLoading,
  balanceFormatted,
  setMaxAmount,
  onBridge,
}) => (
  <Div
    display="flex"
    flexDirection="column"
    gap="1rem"
    p="1.5rem"
    bg="#FFFFFF0D"
    borderRadius="1rem"
  >
    <BridgeNetworkSelector
      sourceNetwork={sourceNetwork}
      setSourceNetwork={setSourceNetwork}
    />

    {/* Destination indicator */}
    <Div display="flex" justifyContent="center" alignItems="center">
      <Div
        px="1rem"
        py="0.25rem"
        borderRadius="1rem"
        bg="#FFFFFF0D"
        color="#FFFFFF80"
        fontSize="0.75rem"
      >
        → To {destNetwork}
      </Div>
    </Div>

    {/* Token */}
    <Div>
      <Label color="#FFFFFF80" fontSize="0.875rem" mb="0.5rem" display="block">
        Token
      </Label>
      <Div display="flex" gap="0.5rem">
        {TOKEN_OPTIONS_LIST.map(({ key: tk, iconUrl, symbol }) => {
          const isSelected = tk === selectedToken;
          return (
            <Button
              key={tk}
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
              onClick={() => setSelectedToken(tk)}
              nHover={{ bg: isSelected ? '#A78BFA1A' : '#FFFFFF1A' }}
            >
              {iconUrl && (
                <img
                  src={iconUrl}
                  alt={symbol}
                  width="20"
                  height="20"
                  style={{ borderRadius: '50%' }}
                />
              )}
              <Span color="#FFFFFF" fontWeight="600">
                {symbol}
              </Span>
            </Button>
          );
        })}
      </Div>
    </Div>

    {/* Amount */}
    <Div>
      <Div display="flex" justifyContent="space-between" mb="0.5rem">
        <Label color="#FFFFFF80" fontSize="0.875rem">
          Amount
        </Label>
        <Button
          all="unset"
          cursor="pointer"
          display="flex"
          gap="0.25rem"
          nHover={{ color: '#A78BFA' }}
          onClick={setMaxAmount}
        >
          <Span color="#FFFFFF80" fontSize="0.875rem">
            Balance:{' '}
            {balanceLoading ? '...' : `${balanceFormatted} ${token.symbol}`}
          </Span>
        </Button>
      </Div>
      <Div
        p="1rem"
        bg="#FFFFFF0D"
        borderRadius="0.75rem"
        border="1px solid #FFFFFF1A"
        display="flex"
        alignItems="center"
      >
        <Input
          all="unset"
          flex="1"
          color="#FFFFFF"
          fontFamily="JetBrains Mono"
          fontSize="1.5rem"
          placeholder="0"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Span color="#FFFFFF80" fontSize="0.875rem" fontWeight="600">
          {token.symbol}
        </Span>
      </Div>
    </Div>

    <BridgeButton
      isDisabled={isDisabled}
      isLoading={isLoading}
      status={status}
      validationMessage={validationMessage}
      token={token}
      destNetwork={destNetwork}
      onBridge={onBridge}
    />
  </Div>
);

export default BridgeForm;
