import type { FC } from 'react';

import {
  BRIDGED_ASSET_METADATA,
  WSOL_SUI_TYPE,
  WSUI_SOLANA_MINT,
} from '@/constants';
import { CHAIN_REGISTRY } from '@/constants/chains';

import type { BridgeDetailsProps } from './bridge.types';

const RECEIVE_TOKEN: Record<string, Record<string, string>> = {
  sui: {
    SUI: BRIDGED_ASSET_METADATA[WSUI_SOLANA_MINT]?.symbol ?? 'wSUI',
    SOL: 'SOL',
  },
  solana: {
    SOL: BRIDGED_ASSET_METADATA[WSOL_SUI_TYPE]?.symbol ?? 'wSOL',
    SUI: 'SUI',
  },
};

const BridgeDetails: FC<BridgeDetailsProps> = ({
  sourceNetwork,
  selectedToken,
  destNetwork,
  amount,
}) => (
  <>
    <div className="p-6 bg-surface-light rounded-2xl flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <span className="text-sm text-text-muted">Route</span>
        <span className="text-sm font-medium text-white">
          {CHAIN_REGISTRY[sourceNetwork].displayName} &#x2192; {destNetwork}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-text-muted">You receive</span>
        <span className="text-sm font-medium text-white">
          {amount || '0'}{' '}
          {RECEIVE_TOKEN[sourceNetwork]?.[selectedToken] ?? selectedToken}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-text-muted">Bridge Fee</span>
        <span className="text-sm font-medium text-white">--</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-text-muted">Estimated Time</span>
        <span className="text-sm font-medium text-white">~2-5 minutes</span>
      </div>
    </div>

    <p className="text-text-dimmed text-xs text-center">
      Powered by XBridge. Assets are bridged as wrapped tokens.
    </p>
  </>
);

export default BridgeDetails;
