# Winter Walrus (Lattice UI) - Project Guide

## Project Overview

**Winter Walrus** is a DeFi application that provides cross-chain swap functionality between SUI and SOL tokens. Users can seamlessly exchange assets across the Sui and Solana blockchains.

- **Tech Stack**: Next.js 16 (App Router + Turbopack), TypeScript 5.9 (strict), React 19, Framer Motion (`motion/react`), Tailwind CSS v4
- **Blockchains**: Sui Network & Solana
- **Wallet**: Privy integration for wallet connection
- **State**: Zustand for global state, TanStack Query v5 for server state, React Hook Form for forms
- **Styling**: Tailwind CSS v4 (utility-first, configured via `@theme` in `globals.css`)
- **Linting**: Biome 2.3 (not ESLint/Prettier)
- **Testing**: Vitest + React Testing Library

## Project Structure

```
lattice-ui/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout (fonts, providers)
│   ├── page.tsx                # Home → SwapView
│   ├── providers.tsx           # Provider composition tree
│   ├── account/page.tsx        # Account → AccountView (dynamic import)
│   └── api/                    # API routes (18 endpoints)
│       ├── enclave/            # TEE enclave proxy
│       ├── solver/             # Solver API proxy (fulfill, metadata, prices, status)
│       ├── xswap/              # Cross-chain swap
│       ├── xbridge/            # Bridge operations (create-mint, set-digest, vote, execute)
│       ├── wallet/             # Wallet management (create-sui, create-solana, link, send)
│       ├── health/             # Health checks (enclave, solver)
│       └── external/           # External API proxy (prices)
│
├── components/                 # React components (4 layers)
│   ├── composed/               # Feature-rich components (header, input-field, settings, wallet-button)
│   ├── layout/                 # Page structure (layout, background)
│   ├── providers/              # Context/state providers (privy, error-boundary, modal, app-state)
│   └── ui/                     # Atomic primitives (icons, tabs, toast, toggle, tooltip, motion)
│
├── hooks/                      # Custom React hooks (4 layers)
│   ├── store/                  # Zustand stores (use-app-state, use-modal, use-network)
│   ├── blockchain/             # Chain data fetching (use-sui-*, use-solana-*, use-token-prices)
│   ├── domain/                 # Business logic (use-swap, use-bridge, use-wallet-*, use-health)
│   └── ui/                     # Component utilities (use-event-listener, use-click-outside, etc.)
│
├── lib/                        # Core business logic
│   ├── config.ts               # Environment variables
│   ├── api/                    # API utilities + Zod validation
│   ├── chain-adapters/         # Chain abstraction (ChainAdapter interface, sui-adapter, solana-adapter)
│   ├── entities/               # DeFi domain models (Token, CurrencyAmount, Fraction, Percent, Trade)
│   ├── enclave/                # Enclave SDK wrapper
│   ├── solver/                 # Solver API client
│   ├── xswap/                  # Cross-chain swap SDK
│   ├── xbridge/                # Bridge SDK
│   ├── privy/                  # Privy server-side (signing, wallet creation)
│   ├── registry/               # On-chain registry SDK
│   ├── wallet/                 # Wallet operations
│   ├── solana/                 # Solana helpers (server client, tx confirmation)
│   ├── sui/                    # Sui helpers (server client)
│   ├── bigint-utils.ts          # BigInt formatting (formatUnits, parseUnits)
│   └── external/               # External API clients (Pyth prices)
│
├── views/                      # Page-level view components
│   ├── swap/                   # Swap + Bridge tabs
│   └── account/                # Balances + Deposit + Withdraw tabs
│
├── constants/                  # App-wide constants
│   ├── colors.ts               # ACCENT color palette
│   ├── coins.ts                # Token metadata (ASSET_METADATA)
│   ├── chains/                 # Chain registry (CHAIN_REGISTRY)
│   ├── routes.ts               # Route definitions
│   ├── storage-keys.ts         # localStorage keys
│   ├── rpc.ts                  # RPC provider config
│   ├── explorer.ts             # Block explorer URLs
│   └── bridged-tokens.ts       # XBridge token metadata
│
├── utils/                      # Pure utility functions
│   ├── bn.ts                   # BigInt helpers (feesCalcUp, parseBigNumberish)
│   ├── money.ts                # Number formatting (Intl)
│   ├── number.ts               # Input parsing
│   ├── format-address.ts       # Address truncation
│   ├── extract-error-message.ts # Error message extraction
│   └── gas-validation.ts       # Gas + alpha limit validation
│
├── interface/                  # Shared TypeScript types
│   └── index.ts                # BigNumberish, AssetMetadata, Node, SdkPool
│
└── public/                     # Static assets
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
// hooks/domain/use-swap/index.ts
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

## Next.js 16 Patterns (App Router)

### 1. Client Components

Use `'use client'` directive for components with hooks, event handlers, or browser APIs:

```typescript
'use client';

import { useState } from 'react';

const InteractiveComponent = () => {
  const [value, setValue] = useState('');
  return <Input value={value} onChange={(e) => setValue(e.target.value)} />;
};
```

### 2. Dynamic Imports (SSR Disabled)

Disable SSR for wallet/web3 components:

```typescript
// app/providers.tsx pattern
import dynamic from 'next/dynamic';

const PrivyProviderWrapper = dynamic(
  import('@/components/providers/privy-provider').then((m) => m.default),
  { ssr: false }
);
```

### 3. Path Aliases

Use `@/` prefix (configured in tsconfig.json):

```typescript
// GOOD
import { useAppState } from '@/hooks/store/use-app-state';
import { ACCENT } from '@/constants/colors';

// AVOID relative paths for deep imports
import { useAppState } from '../../../hooks/store/use-app-state';
```

### 4. Page Component Pattern

Keep pages thin, delegate to views:

```typescript
// app/page.tsx
import SwapView from '@/views/swap';

const HomePage = () => <SwapView />;

export default HomePage;
```

Layout wrapping is handled by `app/layout.tsx` (not in page components).

### 5. Metadata (instead of next/head)

```typescript
// app/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lattice',
  icons: { icon: '/icon.svg' },
};
```

### 6. API Route Handlers

All API routes use Route Handlers with Zod validation:

```typescript
// app/api/{service}/{action}/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { validateParams } from '@/lib/api/validate-params';

const schema = z.object({ /* request shape */ });

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const params = validateParams(schema, body);
    const result = await backendService(params);
    return NextResponse.json({ data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
};
```

---

## State Management

### Zustand (Global State)

This project uses Zustand for global state with `useShallow` selectors:

```typescript
// hooks/store/use-app-state/index.ts
import { create } from 'zustand';

interface AppState {
  balances: Record<string, bigint>;
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
// REQUIRED: Use useShallow selectors (prevents unnecessary re-renders)
import { useShallow } from 'zustand/shallow';

const { update, loadingCoins } = useAppState(
  useShallow((s) => ({ update: s.update, loadingCoins: s.loadingCoins }))
);

// Simple selector (also fine)
const balances = useAppState((state) => state.balances);

// AVOID: Destructuring without selector (re-renders on any state change)
const { balances } = useAppState(); // Bad!
```

### TanStack Query v5 (Server State)

Primary data fetching library with caching and revalidation:

```typescript
import { useQuery } from '@tanstack/react-query';

const { data, error, isLoading } = useQuery({
  queryKey: ['suiBalances', address],
  queryFn: async () => {
    // fetch logic
  },
  enabled: !!address,           // skip when no address
  refetchInterval: 30_000,      // 30s for balances
  staleTime: 5_000,             // dedup within 5s
  refetchOnWindowFocus: false,
});

// Invalidate queries
const queryClient = useQueryClient();
queryClient.invalidateQueries({ queryKey: ['suiBalances'] });
```

`QueryClientProvider` is set up in `app/providers.tsx`.

---

## DeFi Entities (lib/entities/)

### Token

```typescript
import { Token } from '@/lib/entities';

// Pre-defined singletons
Token.SUI
Token.SOL

// From coin type string
const token = Token.fromType(coinType);

// Properties
token.symbol    // 'SUI'
token.decimals  // 9
token.isSui()   // true
```

### CurrencyAmount

```typescript
import { CurrencyAmount, Token } from '@/lib/entities';

// Create from raw blockchain amount
const amount = CurrencyAmount.fromRawAmount(Token.SUI, rawBigNumber);

// Create from human-readable input
const amount = CurrencyAmount.fromHumanAmount(Token.SUI, '1.5');

// Zero amount
const zero = CurrencyAmount.zero(Token.SUI);

// Arithmetic
amount.add(other)
amount.subtract(other)
amount.multiply(factor)

// Display
amount.toExact()         // Full precision string
amount.toFixed(4)        // "1.5000"
amount.toSignificant(4)  // "1.500"

// Comparisons
amount.greaterThan(other)
amount.exceedsBalance(balance)
amount.isZero()
```

### FixedPointMath

```typescript
import { FixedPointMath } from '@/lib/entities';

// Human → raw (for transactions)
const raw = FixedPointMath.toBigNumber(1.5, 9);  // 1500000000

// Raw → human (for display)
const human = FixedPointMath.toNumber(rawBN, 9);  // 1.5
```

---

## Chain Configuration

### CHAIN_REGISTRY

Single source of truth for chain-specific values:

```typescript
import { CHAIN_REGISTRY } from '@/constants/chains';

CHAIN_REGISTRY.sui.displayName   // 'Sui'
CHAIN_REGISTRY.sui.alphaMax      // 0.1 (SUI transaction cap)
CHAIN_REGISTRY.sui.minGas        // 0.005
CHAIN_REGISTRY.solana.alphaMax   // 0.001 (SOL transaction cap)
```

### Chain Adapters

Abstraction layer for chain-specific operations:

```typescript
import { createSuiAdapter, createSolanaAdapter } from '@/lib/chain-adapters';

const adapter = createSuiAdapter(suiClient, mutateSuiBalances);
await adapter.deposit(params);        // Chain-specific deposit
await adapter.refetchBalance();       // Refresh balances
adapter.encodeAddress(address);       // Encode for cross-chain
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
import type { FC, ReactNode } from 'react';

export interface ComponentProps {
  children?: ReactNode;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

// index.tsx
import type { ComponentProps } from './component-name.types';

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

## Styling with Tailwind CSS v4

### Configuration

Tailwind v4 is configured via CSS, not `tailwind.config.js`. Custom theme tokens are defined in `app/globals.css`:

```css
@import "tailwindcss";

@theme {
  --font-sans: "DM Sans", serif;
  --font-mono: "JetBrains Mono", monospace;
  --font-pixel: "PPNeuebit", monospace;

  --color-accent: #a78bfa;
  --color-accent-hover: #c4b5fd;
  --color-surface: #0c0f1d;
  --color-surface-light: #ffffff0d;
  --color-surface-lighter: #ffffff1a;
  --color-surface-hover: #ffffff2a;
  --color-surface-border: #ffffff1a;
  --color-text: #ffffff;
  --color-text-muted: #ffffff80;
  --color-text-dimmed: #ffffff40;
}
```

### Usage Pattern

Use native HTML elements with Tailwind utility classes:

```typescript
<div className="flex flex-col gap-4 p-6 bg-surface-light rounded-2xl">
  <span className="text-text-muted text-sm">Label</span>
  <button className="w-full py-4 bg-accent text-white font-semibold rounded-xl hover:bg-accent-hover disabled:opacity-50">
    Swap
  </button>
</div>
```

### Dynamic Styles

For runtime-dependent values (conditional colors, computed dimensions), use `style` prop:

```typescript
<button
  className="flex-1 p-3 rounded-lg cursor-pointer"
  style={{
    border: `1px solid ${isSelected ? '#A78BFA' : '#FFFFFF1A'}`,
    background: isSelected ? '#A78BFA1A' : '#FFFFFF0D',
  }}
>

<div style={{ height: safeHeight, background: `${config.color}1A` }} />
```

### Responsive Design

Use Tailwind responsive prefixes: `sm:`, `md:`, `lg:`, `xl:`

```typescript
<div className="px-2 sm:px-8 w-full sm:w-[34rem] hidden md:flex" />
```

---

## Framer Motion Animations

### Motion Component

The project's `Motion` component is `motion.div` from `motion/react`:

```typescript
import Motion from '@/components/ui/motion';

<Motion
  className="flex flex-col gap-4"
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
>
  Content
</Motion>
```

For other element types, use `motion.button`, `motion.span`, etc. directly from `motion/react`.

### AnimatePresence for Mount/Unmount

```typescript
import { AnimatePresence } from 'motion/react';

<AnimatePresence>
  {isOpen && (
    <Motion
      initial={{ scaleY: 0 }}
      animate={{ scaleY: 1 }}
      exit={{ scaleY: 0 }}
    >
      Dropdown Content
    </Motion>
  )}
</AnimatePresence>
```

---

## DeFi-Specific Patterns

### BigInt Handling

Token amounts use native `bigint`:

```typescript
import { parseUnits, formatUnits } from '@/lib/bigint-utils';

// Parse human input to raw amount
const raw = parseUnits('1.5', 9);  // 1500000000n

// Format raw amount for display
const display = formatUnits(raw, 9);  // '1.5'

// Arithmetic
const total = amount + fee;
if (amount > balance) {
  setError('Insufficient balance');
}
```

### Token Amount Formatting

Use the entity classes instead of raw BigInt math:

```typescript
import { CurrencyAmount, Token } from '@/lib/entities';

const amount = CurrencyAmount.fromHumanAmount(Token.SUI, inputValue);
const display = amount.toFixed(4); // "1.5000"

if (amount.exceedsBalance(balance)) {
  setError('Insufficient balance');
}
```

### Transaction Status Pattern

```typescript
type SwapStatus = 'idle' | 'depositing' | 'verifying' | 'creating' | 'waiting' | 'success' | 'error';

const [status, setStatus] = useState<SwapStatus>('idle');

const execute = async () => {
  try {
    setStatus('depositing');
    // ... deposit
    setStatus('verifying');
    // ... verify
    setStatus('success');
    toasting.success({ action: 'Swap', message: 'Transaction confirmed!' });
  } catch (err) {
    setStatus('error');
    const message = extractErrorMessage(err, 'Swap failed');
    toasting.error({ action: 'Swap', message });
  }
};
```

---

## Toast Notifications

Use the custom `toasting` factory (not raw `toast` from react-hot-toast):

```typescript
import { toasting } from '@/components/ui/toast';

// Success with link
toasting.success({ action: 'Swap', message: 'Confirmed!', link: explorerUrl });

// Error
toasting.error({ action: 'Bridge', message: 'Insufficient balance' });

// Loading (returns toast ID for later update)
toasting.loading({ message: 'Confirming transaction...' }, toastId);

// Dismiss
toasting.dismiss(toastId);
```

---

## Wallet Integration (Privy)

### Basic Usage

```typescript
import { usePrivy } from '@privy-io/react-auth';

const { login, logout, authenticated, user, ready } = usePrivy();
```

### Getting Wallet Addresses

Use the project's custom hook (not raw Privy parsing):

```typescript
import { useWalletAddresses } from '@/hooks/domain/use-wallet-addresses';

const { addresses, hasWallet, getAddress } = useWalletAddresses();

const suiAddress = getAddress('sui');
const solAddress = getAddress('solana');

if (hasWallet('sui')) {
  // Sui wallet available
}
```

---

## Anti-Patterns to Avoid

### 1. Hard-Coded Colors

```typescript
// BAD - hard-coded hex in className
<div className="bg-[#A78BFA]" />

// GOOD - use theme tokens
<div className="bg-accent" />
```

### 2. Direct Zustand Destructuring

```typescript
// BAD - re-renders on any state change
const { balances, loadingCoins } = useAppState();

// GOOD - selector with useShallow
const { balances, loadingCoins } = useAppState(
  useShallow((s) => ({ balances: s.balances, loadingCoins: s.loadingCoins }))
);
```

### 3. Raw Privy Address Extraction

```typescript
// BAD - manual linkedAccounts parsing
const suiWallet = user?.linkedAccounts.find(...);

// GOOD - use the hook
const { getAddress } = useWalletAddresses();
const suiAddress = getAddress('sui');
```

### 4. Floating-Point Token Math

```typescript
// BAD - floating point
const total = amount * 1e9;

// GOOD - BigInt / CurrencyAmount
const total = parseUnits(amount, 9);
```

### 5. Using `<img>` Instead of `<Image>`

```typescript
// BAD - raw img element (fails Biome noImgElement)
<img src={iconUrl} alt="Token" />

// GOOD - Next.js Image with explicit dimensions
import Image from 'next/image';
<Image src={iconUrl} alt="Token" width={32} height={32} />
```

### 6. Non-Focusable Interactive Elements

```typescript
// BAD - div with onClick but no keyboard support
<div onClick={handleClick}>Click me</div>

// GOOD - use <button> for interactive elements
<button type="button" onClick={handleClick}>Click me</button>

// If a non-button element must be interactive, add role + tabIndex + keyboard handler:
import { handleKeyDown } from '@/utils/handle-key-down';
<div role="button" tabIndex={0} onClick={handleClick} onKeyDown={handleKeyDown(handleClick)}>
  Click me
</div>
```

### 7. Labels Without Associated Controls

```typescript
// BAD - label not associated with any input
<label>Amount</label>

// GOOD - associate via htmlFor/id
<label htmlFor="amount">Amount</label>
<input id="amount" />

// GOOD - use <span> for decorative labels (no input to associate)
<span className="text-sm">Token</span>
```

### 8. Silent Error Swallowing

```typescript
// BAD - error silently lost
try { await doThing(); } catch {}

// GOOD - extract and show error
try {
  await doThing();
} catch (err) {
  const message = extractErrorMessage(err, 'Operation failed');
  toasting.error({ action: 'Action', message });
}
```

---

## Accessibility Checklist

When adding or modifying components, ensure:

- [ ] Icon-only buttons have `aria-label` attribute
- [ ] Interactive elements are keyboard focusable (`<button>` preferred, or `role="button"` + `tabIndex={0}` + keyboard handler)
- [ ] Use `handleKeyDown` from `@/utils/handle-key-down` for non-button interactive elements
- [ ] Tab components use `role="tablist"`, `role="tab"`, `aria-selected`
- [ ] Modals trap focus and return focus on close
- [ ] Color is not the sole indicator of state (add text/icons)
- [ ] Form inputs have associated labels (`htmlFor`/`id`) or use `<span>` for decorative labels
- [ ] Always use `<Image>` from `next/image` instead of `<img>`
- [ ] Toggle/switch elements have `aria-checked` and `tabIndex={0}`
- [ ] Tooltips are keyboard accessible (not hover-only)

---

## File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | `kebab-case/index.tsx` | `wallet-button/index.tsx` |
| Types | `{name}.types.ts` | `input-field.types.ts` |
| Hooks | `use-{name}/index.ts` | `use-swap/index.ts` |
| Utils | `{name}.ts` | `format-address.ts` |
| Constants | `{category}.ts` | `colors.ts` |
| API Routes | `{action}/route.ts` | `create-request/route.ts` |
| SVG Icons | `{name}.tsx` | `wallet.tsx` |

---

## Available SVG Icons

Import from `@/components/ui/icons`:

```typescript
import {
  LogoSVG, SwapSVG, WalletSVG, CogSVG, CopySVG,
  CheckSVG, ErrorSVG, InfoSVG, SearchSVG,
  CaretDownSVG, CaretUpSVG, ChevronDownSVG, ChevronRightSVG,
  ExternalLinkSVG, LogoutSVG, GridSVG, BarsSVG,
  // Pizza indicators (balance quick-select)
  PizzaPart25SVG, PizzaPart50SVG, PizzaPart100SVG,
} from '@/components/ui/icons';
```

---

## Development Commands

```bash
pnpm dev          # Development server (port 3000, Turbopack)
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Biome check
pnpm lint:fix     # Biome auto-fix
pnpm format       # Biome format
pnpm test         # Vitest watch mode
pnpm test:run     # Vitest single run (CI)
```

Type checking (not in scripts):
```bash
npx tsc --noEmit  # TypeScript type check
```

---

## Important Project Notes

1. **Package Manager**: pnpm (9.1.0, pinned)
2. **Node Version**: >=18.17
3. **Active Views**: `views/swap` (Swap + Bridge tabs) and `views/account` (Balances + Deposit + Withdraw)
4. **Commit Style**: Gitmoji convention via commitlint

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
import Image from 'next/image';
import { usePathname } from 'next/navigation';

// Animation
import { motion, AnimatePresence } from 'motion/react';
import Motion from '@/components/ui/motion';

// State
import { useShallow } from 'zustand/react/shallow';
import { useAppState } from '@/hooks/store/use-app-state';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// Entities
import { Token, CurrencyAmount, FixedPointMath } from '@/lib/entities';
import { parseUnits, formatUnits } from '@/lib/bigint-utils';

// Utils
import { extractErrorMessage } from '@/utils';
import { toasting } from '@/components/ui/toast';

// Constants
import { CHAIN_REGISTRY } from '@/constants/chains';

// Types
import type { ComponentProps } from './component.types';
```

---

**Last Updated**: 2026-02-10
**Active Views**: `views/swap` and `views/account`
**Main Features**: Cross-chain SUI/SOL token swapping
