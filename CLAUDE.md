# Winter Walrus (Lattice UI) - Project Guide

## Project Overview

**Winter Walrus** is a DeFi application that provides cross-chain swap functionality between SUI and SOL tokens. Users can seamlessly exchange assets across the Sui and Solana blockchains.

- **Tech Stack**: Next.js 14 (Pages Router), TypeScript, React 18, Framer Motion, Stylin.js
- **Blockchains**: Sui Network & Solana
- **Wallet**: Privy integration for wallet connection
- **State**: Zustand for global state, TanStack Query for server state
- **Styling**: Stylin.js (CSS-in-JS with styled components)

## Project Structure

```
lattice-ui/
├── components/          # Reusable UI components
│   ├── app-state-provider/   # Zustand store hydration
│   ├── background/            # Animated backgrounds (blur, particles)
│   ├── header/                # App header with TVL, navbar
│   ├── input-field/           # Token input components with asset selection
│   ├── privy-provider/        # Privy wallet provider (SSR disabled)
│   ├── settings/              # Settings menu (validator, RPC, explorer)
│   ├── svg/                   # SVG icon components (27 icons)
│   ├── tabs/                  # Tab navigation component
│   └── wallet-button/         # Wallet connection UI
├── constants/           # App-wide constants
│   ├── colors.ts              # Color palette (ACCENT variants)
│   ├── index.ts               # Main constants export
│   ├── routes.ts              # Route definitions
│   └── storage-keys.ts        # LocalStorage keys
├── hooks/               # Custom React hooks
│   ├── use-app-state/         # Zustand global state
│   ├── use-blizzard-sdk/      # Blizzard SDK integration
│   ├── use-coins/             # Coin data fetching
│   ├── use-fees/              # Transaction fee calculations
│   ├── use-solana-*/          # Solana blockchain hooks
│   ├── use-sui-*/             # Sui blockchain hooks
│   └── use-network/           # Network configuration
├── pages/               # Next.js pages (routing)
│   ├── _app.tsx               # App wrapper with providers
│   ├── index.tsx              # Home page → Swap view
│   └── [lst].tsx              # Dynamic LST page → Swap view
├── public/              # Static assets
└── views/               # Page-level view components
    └── swap/            # Main swap interface (ONLY active view)
```

---

## React Best Practices for This Project

### 1. Component Composition Pattern

Always prefer composition over prop drilling:

```typescript
// GOOD - Composition
<SwapForm>
  <TokenInput side="from" />
  <SwapButton />
  <TokenInput side="to" />
</SwapForm>

// AVOID - Prop drilling
<SwapForm
  fromToken={...}
  toToken={...}
  onSwap={...}
  // 10 more props
/>
```

### 2. Custom Hooks for Logic Extraction

Extract business logic into custom hooks:

```typescript
// hooks/use-swap/index.ts
export const useSwap = () => {
  const { balances } = useAppState();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const executeSwap = useCallback(async () => {
    setLoading(true);
    try {
      // swap logic
    } finally {
      setLoading(false);
    }
  }, [amount]);

  return { amount, setAmount, loading, executeSwap };
};
```

### 3. Memoization Strategy

Use memoization judiciously - only when needed:

```typescript
// Memoize expensive calculations
const formattedBalance = useMemo(() =>
  formatBalance(balance, decimals),
  [balance, decimals]
);

// Memoize callbacks passed to children
const handleSelect = useCallback((coin: Coin) => {
  setSelectedCoin(coin);
}, []);

// DON'T memoize simple values
// const isDisabled = useMemo(() => !amount, [amount]); // Overkill!
const isDisabled = !amount; // Fine
```

### 4. Event Handler Naming

Follow consistent naming:

```typescript
// Props: on{Event}
type Props = {
  onSelect: (coin: Coin) => void;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

// Handlers: handle{Event}
const handleSelect = (coin: Coin) => { ... };
const handleChange = (e: ChangeEvent) => { ... };
const handleSubmit = () => { ... };
```

### 5. Loading & Error States

Always handle loading and error states:

```typescript
const Component = () => {
  const { data, isLoading, error } = useQuery(...);

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return null;

  return <Content data={data} />;
};
```

---

## Next.js 14 Patterns (Pages Router)

### 1. Dynamic Imports for Client Components

Disable SSR for wallet/web3 components:

```typescript
// components/privy-provider/index.tsx pattern
import dynamic from 'next/dynamic';

const PrivyProviderWrapper = dynamic(
  () => import('@/components/privy-provider').then((m) => m.default),
  { ssr: false }
);
```

### 2. Path Aliases

Use `@/` prefix (configured in tsconfig.json):

```typescript
// GOOD
import { useAppState } from '@/hooks/use-app-state';
import { ACCENT } from '@/constants/colors';

// AVOID relative paths for deep imports
import { useAppState } from '../../../hooks/use-app-state';
```

### 3. Page Component Pattern

Keep pages thin, delegate to views:

```typescript
// pages/index.tsx
import { Layout } from '@/components/layout';
import SwapView from '@/views/swap';

const HomePage = () => (
  <Layout>
    <SwapView />
  </Layout>
);

export default HomePage;
```

### 4. SEO with next/head

```typescript
import Head from 'next/head';

const Page = () => (
  <>
    <Head>
      <title>Swap | Winter Walrus</title>
      <meta name="description" content="Cross-chain SUI/SOL swap" />
    </Head>
    <Content />
  </>
);
```

---

## State Management

### Zustand (Global State)

This project uses Zustand for global state:

```typescript
// hooks/use-app-state/index.ts
import { create } from 'zustand';

interface AppState {
  balances: Record<string, BigNumber>;
  loadingCoins: boolean;
  loadingObjects: boolean;
  update: (partial: Partial<AppState>) => void;
  mutate: () => void;
}

export const useAppState = create<AppState>((set) => ({
  balances: {},
  loadingCoins: true,
  loadingObjects: true,
  update: set,
  mutate: () => {},
}));
```

**Usage patterns:**

```typescript
// Read state
const { balances, loadingCoins } = useAppState();

// Update state
const { update } = useAppState();
update({ loadingCoins: false });

// Selector pattern (prevents unnecessary re-renders)
const balances = useAppState((state) => state.balances);
```

### TanStack Query (Server State)

For data fetching with caching:

```typescript
import { useQuery } from '@tanstack/react-query';

const useTokenPrice = (symbol: string) => {
  return useQuery({
    queryKey: ['price', symbol],
    queryFn: () => fetchPrice(symbol),
    staleTime: 30_000, // 30 seconds
    refetchInterval: 60_000, // 1 minute
  });
};
```

### SWR (Alternative Pattern)

Also available in this project:

```typescript
import useSWR from 'swr';

const { data, error, isLoading, mutate } = useSWR(
  '/api/prices',
  fetcher,
  { refreshInterval: 30000 }
);
```

---

## TypeScript Patterns

### 1. Type Files Convention

```
component-name/
├── index.tsx
└── component-name.types.ts
```

### 2. Props Interface Pattern

```typescript
// component-name.types.ts
import { FC, ReactNode } from 'react';

export interface ComponentProps {
  children?: ReactNode;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

// index.tsx
import { ComponentProps } from './component-name.types';

const Component: FC<ComponentProps> = ({
  children,
  value,
  onChange,
  disabled = false
}) => { ... };
```

### 3. Discriminated Unions for States

```typescript
type SwapState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; txHash: string }
  | { status: 'error'; error: Error };

// Usage with exhaustive checking
switch (state.status) {
  case 'idle': return <IdleView />;
  case 'loading': return <LoadingView />;
  case 'success': return <SuccessView txHash={state.txHash} />;
  case 'error': return <ErrorView error={state.error} />;
}
```

### 4. Generic Component Pattern

```typescript
interface SelectProps<T> {
  items: T[];
  value: T;
  onChange: (item: T) => void;
  renderItem: (item: T) => ReactNode;
  keyExtractor: (item: T) => string;
}

const Select = <T,>({ items, value, onChange, renderItem, keyExtractor }: SelectProps<T>) => {
  // ...
};
```

---

## Styling with Stylin.js

### Core Elements

```typescript
import { Div, Span, Button, Input, A } from '@stylin.js/elements';
```

### Prop Shortcuts

```typescript
<Div
  // Spacing
  p="1rem"           // padding
  px="1rem"          // padding-left + padding-right
  py="0.5rem"        // padding-top + padding-bottom
  m="1rem"           // margin
  gap="0.5rem"       // flex/grid gap

  // Layout
  display="flex"
  flexDirection="column"
  alignItems="center"
  justifyContent="space-between"

  // Sizing
  width="100%"
  maxWidth="400px"
  height="auto"

  // Colors
  bg="#FFFFFF0D"     // background
  color="#FFFFFF"    // text color

  // Borders
  borderRadius="12px"
  border="1px solid #FFFFFF1A"

  // Hover/Focus states
  nHover={{ bg: '#FFFFFF1A', transform: 'scale(1.02)' }}
  nFocus={{ outline: '2px solid #A78BFA' }}

  // Transitions
  transition="all 0.2s ease"

  // Cursor
  cursor="pointer"
/>
```

### Responsive Design

Use arrays for responsive values: `[mobile, tablet, desktop, wide]`

```typescript
<Div
  display={['block', 'block', 'flex', 'flex']}
  width={['100%', '100%', '50%', '400px']}
  fontSize={['14px', '14px', '16px', '18px']}
  p={['0.5rem', '1rem', '1.5rem', '2rem']}
/>
```

### Color Constants

```typescript
import { ACCENT, ACCENT_HOVER, ACCENT_80, ACCENT_4D } from '@/constants/colors';

<Button
  bg={ACCENT}
  nHover={{ bg: ACCENT_HOVER }}
>
  Swap
</Button>
```

---

## Framer Motion Animations

### Basic Animation

```typescript
import { motion } from 'motion/react';
import { Div } from '@stylin.js/elements';

const Motion = motion.create(Div);

<Motion
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
>
  Content
</Motion>
```

### Stagger Children

```typescript
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

<Motion variants={container} initial="hidden" animate="show">
  {items.map((item) => (
    <Motion key={item.id} variants={item}>
      {item.name}
    </Motion>
  ))}
</Motion>
```

### Layout Animations

```typescript
<Motion layout layoutId={`token-${token.id}`}>
  <TokenCard token={token} />
</Motion>
```

---

## DeFi-Specific Patterns

### BigNumber Handling

Always use BigNumber for token amounts:

```typescript
import BigNumber from 'bignumber.js';

// Configure for crypto precision
BigNumber.config({ DECIMAL_PLACES: 18 });

// Convert from user input
const amount = new BigNumber(inputValue);

// Format for display
const display = amount.toFormat(4); // "1,234.5678"

// Check validity
if (amount.isNaN() || amount.lte(0)) {
  return; // Invalid input
}

// Compare with balance
if (amount.gt(balance)) {
  setError('Insufficient balance');
}
```

### Token Amount Formatting

```typescript
// utils/format.ts
export const formatTokenAmount = (
  amount: BigNumber | string,
  decimals: number = 9,
  displayDecimals: number = 4
): string => {
  const bn = new BigNumber(amount);
  const normalized = bn.dividedBy(10 ** decimals);
  return normalized.toFormat(displayDecimals);
};

// Usage
const display = formatTokenAmount(rawBalance, 9, 4); // "1.2345"
```

### Transaction Handling Pattern

```typescript
const useTransaction = () => {
  const [status, setStatus] = useState<'idle' | 'signing' | 'confirming' | 'success' | 'error'>('idle');

  const execute = async (tx: Transaction) => {
    try {
      setStatus('signing');
      const signed = await wallet.signTransaction(tx);

      setStatus('confirming');
      const result = await client.executeTransaction(signed);

      setStatus('success');
      toast.success('Transaction confirmed!');
      return result;
    } catch (error) {
      setStatus('error');
      toast.error(error.message);
      throw error;
    }
  };

  return { status, execute };
};
```

---

## Wallet Integration (Privy)

### Basic Usage

```typescript
import { usePrivy } from '@privy-io/react-auth';

const WalletButton = () => {
  const { login, logout, authenticated, user, ready } = usePrivy();

  if (!ready) return <Skeleton />;

  if (!authenticated) {
    return <Button onClick={login}>Connect Wallet</Button>;
  }

  return (
    <Button onClick={logout}>
      {formatAddress(user.wallet?.address)}
    </Button>
  );
};
```

### Getting Wallet Address

```typescript
const { user } = usePrivy();

// Sui address
const suiWallet = user?.linkedAccounts.find(
  (account) => account.type === 'wallet' && account.chainType === 'sui'
);
const suiAddress = suiWallet?.address;

// Solana address
const solanaWallet = user?.linkedAccounts.find(
  (account) => account.type === 'wallet' && account.chainType === 'solana'
);
const solanaAddress = solanaWallet?.address;
```

---

## Performance Optimization

### 1. Lazy Loading Components

```typescript
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('@/components/chart'), {
  loading: () => <Skeleton height={300} />,
  ssr: false,
});
```

### 2. Virtualization for Long Lists

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const TokenList = ({ tokens }) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: tokens.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
  });

  return (
    <Div ref={parentRef} height="400px" overflow="auto">
      <Div height={`${virtualizer.getTotalSize()}px`} position="relative">
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <TokenRow
            key={virtualItem.key}
            token={tokens[virtualItem.index]}
            style={{
              position: 'absolute',
              top: virtualItem.start,
              height: virtualItem.size,
            }}
          />
        ))}
      </Div>
    </Div>
  );
};
```

### 3. Debouncing User Input

```typescript
import { useDebouncedValue } from 'use-debounce';

const [inputValue, setInputValue] = useState('');
const [debouncedValue] = useDebouncedValue(inputValue, 300);

// Use debouncedValue for API calls
useEffect(() => {
  if (debouncedValue) {
    fetchQuote(debouncedValue);
  }
}, [debouncedValue]);
```

### 4. Avoiding Unnecessary Re-renders

```typescript
// Use selectors with Zustand
const balance = useAppState((state) => state.balances[coinType]);

// NOT this (re-renders on any state change)
const { balances } = useAppState();
const balance = balances[coinType];
```

---

## Error Handling

### Toast Notifications

```typescript
import { toast } from 'react-hot-toast';

// Success
toast.success('Swap completed!');

// Error with custom styling
toast.error('Transaction failed', {
  duration: 5000,
});

// Loading with promise
toast.promise(executeSwap(), {
  loading: 'Swapping...',
  success: 'Swap completed!',
  error: (err) => `Failed: ${err.message}`,
});
```

### Error Boundaries

```typescript
import { Component, ReactNode } from 'react';

class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

---

## Common Pitfalls

### 1. Missing Key Prop

```typescript
// BAD - Using index as key
{tokens.map((token, index) => (
  <TokenRow key={index} token={token} />
))}

// GOOD - Using unique identifier
{tokens.map((token) => (
  <TokenRow key={token.coinType} token={token} />
))}
```

### 2. Stale Closure in useEffect

```typescript
// BAD - Stale closure
useEffect(() => {
  const interval = setInterval(() => {
    console.log(count); // Always logs initial value
  }, 1000);
  return () => clearInterval(interval);
}, []); // Missing count dependency

// GOOD - Use ref or include in deps
const countRef = useRef(count);
countRef.current = count;

useEffect(() => {
  const interval = setInterval(() => {
    console.log(countRef.current); // Current value
  }, 1000);
  return () => clearInterval(interval);
}, []);
```

### 3. Hydration Mismatch

```typescript
// BAD - Different values server vs client
const [time, setTime] = useState(new Date().toISOString());

// GOOD - Initialize on client only
const [time, setTime] = useState<string | null>(null);
useEffect(() => {
  setTime(new Date().toISOString());
}, []);
```

### 4. Missing Cleanup

```typescript
// GOOD - Always cleanup subscriptions
useEffect(() => {
  const subscription = client.subscribe(handleUpdate);
  return () => subscription.unsubscribe();
}, []);
```

---

## File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | `kebab-case/index.tsx` | `wallet-button/index.tsx` |
| Types | `{name}.types.ts` | `input-field.types.ts` |
| Hooks | `use-{name}/index.ts` | `use-coins/index.ts` |
| Utils | `{name}.ts` | `format.ts` |
| Constants | `{category}.ts` | `colors.ts` |
| SVG | `{name}.tsx` | `swap.tsx` |

---

## Available SVG Icons

Import from `@/components/svg`:

```typescript
import {
  LogoSVG, SwapSVG, WalletSVG, CogSVG, CopySVG,
  CheckSVG, ErrorSVG, InfoSVG, SearchSVG,
  CaretDownSVG, CaretUpSVG, ChevronDownSVG, ChevronRightSVG,
  ExternalLinkSVG, LogoutSVG, GridSVG, BarsSVG,
  // DeFi protocol icons
  BluefinSVG, BucketSVG, ScallopSVG, NoodlesSVG, WalSVG,
  // Pizza indicators
  PizzaPart25SVG, PizzaPart50SVG, PizzaPart100SVG,
} from '@/components/svg';
```

---

## Development Commands

```bash
pnpm dev          # Development server (port 3000)
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm type-check   # TypeScript check (npx tsc --noEmit)
```

---

## Important Project Notes

1. **Privy App ID**: `cmla080ug00abk10dlfl0bplc`
2. **Package Manager**: pnpm (9.1.0)
3. **Node Version**: >=18.17 (see .nvmrc)
4. **No Navigation Menu**: `NAV_ITEMS` is intentionally empty
5. **Single View**: Only `views/swap` is active

### Removed Features (Do Not Recreate)

- Portfolio view
- DeFi integrations view
- Statistics view
- Staking features (Stake, Unstake, Transmute, Epoch)

---

## Quick Reference

### Imports Template

```typescript
// React
import { FC, useState, useEffect, useCallback, useMemo } from 'react';

// Next.js
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useRouter } from 'next/router';

// Styling
import { Div, Span, Button, Input } from '@stylin.js/elements';
import { motion } from 'motion/react';

// State
import { useAppState } from '@/hooks/use-app-state';

// Utils
import BigNumber from 'bignumber.js';
import { toast } from 'react-hot-toast';

// Constants
import { ACCENT, ACCENT_HOVER } from '@/constants/colors';

// Types
import { ComponentProps } from './component.types';
```

---

**Last Updated**: 2026-02-10
**Active View**: `views/swap` only
**Main Features**: Cross-chain SUI/SOL token swapping
