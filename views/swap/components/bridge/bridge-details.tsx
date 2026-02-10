import { Div, P, Span } from '@stylin.js/elements';
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
    <Div
      p="1.5rem"
      bg="#FFFFFF0D"
      borderRadius="1rem"
      display="flex"
      flexDirection="column"
      gap="1rem"
    >
      <Div display="flex" justifyContent="space-between" alignItems="center">
        <Span fontSize="0.875rem" color="#FFFFFF80">
          Route
        </Span>
        <Span fontSize="0.875rem" fontWeight="500" color="#FFFFFF">
          {CHAIN_REGISTRY[sourceNetwork].displayName} → {destNetwork}
        </Span>
      </Div>
      <Div display="flex" justifyContent="space-between" alignItems="center">
        <Span fontSize="0.875rem" color="#FFFFFF80">
          You receive
        </Span>
        <Span fontSize="0.875rem" fontWeight="500" color="#FFFFFF">
          {amount || '0'}{' '}
          {RECEIVE_TOKEN[sourceNetwork]?.[selectedToken] ?? selectedToken}
        </Span>
      </Div>
      <Div display="flex" justifyContent="space-between" alignItems="center">
        <Span fontSize="0.875rem" color="#FFFFFF80">
          Bridge Fee
        </Span>
        <Span fontSize="0.875rem" fontWeight="500" color="#FFFFFF">
          --
        </Span>
      </Div>
      <Div display="flex" justifyContent="space-between" alignItems="center">
        <Span fontSize="0.875rem" color="#FFFFFF80">
          Estimated Time
        </Span>
        <Span fontSize="0.875rem" fontWeight="500" color="#FFFFFF">
          ~2-5 minutes
        </Span>
      </Div>
    </Div>

    <P color="#FFFFFF40" fontSize="0.75rem" textAlign="center">
      Powered by XBridge. Assets are bridged as wrapped tokens.
    </P>
  </>
);

export default BridgeDetails;
