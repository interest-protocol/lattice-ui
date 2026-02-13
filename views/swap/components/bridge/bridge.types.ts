import { SUI_TYPE_ARG } from '@mysten/sui/utils';

import { WSOL_SUI_TYPE } from '@/constants/bridged-tokens';
import type { ChainKey } from '@/constants/chains';
import type { BridgeDirection, BridgeStatus } from '@/hooks/domain/use-bridge';

export interface BridgeRouteToken {
  symbol: string;
  iconUrl: string;
  decimals: number;
  type: string;
}

export interface BridgeRoute {
  key: BridgeDirection;
  sourceChain: ChainKey;
  destChain: ChainKey;
  sourceToken: BridgeRouteToken;
  destToken: Omit<BridgeRouteToken, 'type'>;
  enabled: boolean;
  label: string;
}

export const BRIDGE_ROUTES: readonly BridgeRoute[] = [
  {
    key: 'sol-to-wsol',
    sourceChain: 'solana',
    destChain: 'sui',
    sourceToken: {
      symbol: 'SOL',
      iconUrl: '/sol-logo.svg',
      decimals: 9,
      type: 'sol',
    },
    destToken: {
      symbol: 'wSOL',
      iconUrl: '/sol-logo.svg',
      decimals: 9,
    },
    enabled: true,
    label: 'SOL → wSOL',
  },
  {
    key: 'wsol-to-sol',
    sourceChain: 'sui',
    destChain: 'solana',
    sourceToken: {
      symbol: 'wSOL',
      iconUrl: '/sol-logo.svg',
      decimals: 9,
      type: WSOL_SUI_TYPE,
    },
    destToken: {
      symbol: 'SOL',
      iconUrl: '/sol-logo.svg',
      decimals: 9,
    },
    enabled: true,
    label: 'wSOL → SOL',
  },
  {
    key: 'sui-to-wsui',
    sourceChain: 'sui',
    destChain: 'solana',
    sourceToken: {
      symbol: 'SUI',
      iconUrl: '/sui-logo.svg',
      decimals: 9,
      type: SUI_TYPE_ARG,
    },
    destToken: {
      symbol: 'wSUI',
      iconUrl: '/sui-logo.svg',
      decimals: 9,
    },
    enabled: false,
    label: 'SUI → wSUI',
  },
  {
    key: 'wsui-to-sui',
    sourceChain: 'solana',
    destChain: 'sui',
    sourceToken: {
      symbol: 'wSUI',
      iconUrl: '/sui-logo.svg',
      decimals: 9,
      type: SUI_TYPE_ARG,
    },
    destToken: {
      symbol: 'SUI',
      iconUrl: '/sui-logo.svg',
      decimals: 9,
    },
    enabled: false,
    label: 'wSUI → SUI',
  },
];

export interface BridgeFromCardProps {
  route: BridgeRoute;
  amount: string;
  setAmount: (val: string) => void;
  balance: bigint;
  balanceLoading: boolean;
  onOpenRouteSelector: () => void;
}

export interface BridgeToCardProps {
  route: BridgeRoute;
  amount: string;
}

export interface BridgeRouteSelectorProps {
  routes: readonly BridgeRoute[];
  selectedRoute: BridgeRoute;
  routeBalances: Record<string, bigint>;
  onSelect: (route: BridgeRoute) => void;
}

export interface BridgeDetailsInlineProps {
  route: BridgeRoute;
  amount: string;
}

export interface BridgeProgressStepperProps {
  status: BridgeStatus;
  direction: BridgeDirection;
  onRetry: () => void;
}

export interface ValidationResult {
  isDisabled: boolean;
  message: string | null;
}
