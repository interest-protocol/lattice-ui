import { SUI_TYPE_ARG } from '@mysten/sui/utils';
import Image from 'next/image';
import type { FC } from 'react';

import { ASSET_METADATA, SOL_TYPE } from '@/constants/coins';
import type { BridgeFormProps, TokenKey } from './bridge.types';
import BridgeButton from './bridge-button';
import BridgeNetworkSelector from './bridge-network-selector';

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
  <div className="flex flex-col gap-4 p-6 bg-surface-light rounded-2xl">
    <BridgeNetworkSelector
      sourceNetwork={sourceNetwork}
      setSourceNetwork={setSourceNetwork}
    />

    {/* Destination indicator */}
    <div className="flex justify-center items-center">
      <div className="px-4 py-1 rounded-2xl bg-surface-light text-text-muted text-xs">
        &#x2192; To {destNetwork}
      </div>
    </div>

    {/* Token */}
    <div>
      <span className="text-text-muted text-sm mb-2 block">Token</span>
      <div className="flex gap-2">
        {TOKEN_OPTIONS_LIST.map(({ key: tk, iconUrl, symbol }) => {
          const isSelected = tk === selectedToken;
          return (
            <button
              type="button"
              key={tk}
              className="flex-1 p-3 flex items-center justify-center gap-2 cursor-pointer rounded-lg border-none"
              style={{
                border: `1px solid ${isSelected ? '#A78BFA' : '#FFFFFF1A'}`,
                background: isSelected ? '#A78BFA1A' : '#FFFFFF0D',
              }}
              onClick={() => setSelectedToken(tk)}
            >
              {iconUrl && (
                <Image
                  src={iconUrl}
                  alt={symbol}
                  width={20}
                  height={20}
                  style={{ borderRadius: '50%' }}
                />
              )}
              <span className="text-white font-semibold">{symbol}</span>
            </button>
          );
        })}
      </div>
    </div>

    {/* Amount */}
    <div>
      <div className="flex justify-between mb-2">
        <span className="text-text-muted text-sm">Amount</span>
        <button
          type="button"
          className="cursor-pointer flex gap-1 hover:text-accent bg-transparent border-none p-0 text-inherit"
          onClick={setMaxAmount}
        >
          <span className="text-text-muted text-sm">
            Balance:{' '}
            {balanceLoading ? '...' : `${balanceFormatted} ${token.symbol}`}
          </span>
        </button>
      </div>
      <div className="p-4 bg-surface-light rounded-xl border border-surface-border flex items-center">
        <input
          className="flex-1 bg-transparent border-none outline-none text-white font-mono text-2xl appearance-none"
          placeholder="0"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <span className="text-text-muted text-sm font-semibold">
          {token.symbol}
        </span>
      </div>
    </div>

    <BridgeButton
      isDisabled={isDisabled}
      isLoading={isLoading}
      status={status}
      validationMessage={validationMessage}
      token={token}
      destNetwork={destNetwork}
      onBridge={onBridge}
    />
  </div>
);

export default BridgeForm;
