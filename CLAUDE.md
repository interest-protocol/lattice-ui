# Winter Walrus (Lattice UI) - Project Guide

## Project Overview

**Winter Walrus** is a DeFi application that provides cross-chain swap functionality between SUI and SOL tokens. Users can seamlessly exchange assets across the Sui and Solana blockchains.

- **Tech Stack**: Next.js 16 (App Router + Turbopack), TypeScript 5.9 (strict), React 19 + React Compiler, Framer Motion (`motion/react`), Tailwind CSS v4
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
│   ├── composed/               # Feature-rich components (header, footer, health-indicator, input-field, settings, wallet-button)
│   ├── layout/                 # Page structure (layout, background)
│   ├── providers/              # Context/state providers (privy, error-boundary, modal, app-state, wallet-registration)
│   └── ui/                     # Atomic primitives (icons, tabs, toast, toggle, tooltip, motion)
│
├── hooks/                      # Custom React hooks (4 layers)
│   ├── store/                  # Zustand stores (use-app-state, use-modal, use-network)
│   ├── blockchain/             # Chain data fetching (use-sui-*, use-solana-*, use-token-prices)
│   ├── domain/                 # Business logic (use-swap, use-bridge, use-wallet-*, use-health, use-metadata, use-get-explorer-url)
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
│   ├── network.ts              # Network enum (mainnet)
│   ├── rpc.ts                  # RPC provider config
│   ├── explorer.ts             # Block explorer URLs
│   ├── toast.tsx               # Toast duration constant
│   └── bridged-tokens.ts       # XBridge token metadata
│
├── utils/                      # Pure utility functions
│   ├── bn.ts                   # BigInt helpers (feesCalcUp, parseBigNumberish)
│   ├── money.ts                # Number formatting (Intl)
│   ├── number.ts               # Input parsing
│   ├── format-address.ts       # Address truncation
│   ├── extract-error-message.ts # Error message extraction
│   ├── gas-validation.ts       # Gas + alpha limit validation
│   └── handle-key-down.ts      # Keyboard event handler for a11y
│
├── interface/                  # Shared TypeScript types
│   └── index.ts                # BigNumberish, AssetMetadata, Node, SdkPool
│
└── public/                     # Static assets
```

---

## Rules of React (Compiler-Critical)

This project has the **React Compiler** enabled. The compiler auto-memoizes components, hooks, and expressions — but **only if you follow the Rules of React**. Violations silently disable optimizations for the affected code.

### 1. Components and Hooks Must Be Pure

- **Idempotent**: Same inputs (props, state, context) → same JSX output. No side effects during render.
- **No mutation during render**: Never mutate props, state, or values read during render. Derive new values instead.
- **Locally sound**: Only mutate values created within the render scope (local variables, arrays, objects).

```typescript
// BAD — mutates during render (compiler skips optimization)
const items = props.items;
items.sort((a, b) => a.name.localeCompare(b.name)); // Mutates input!

// GOOD — creates a new array
const items = props.items.toSorted((a, b) => a.name.localeCompare(b.name));
```

### 2. Never Call Components as Functions

```typescript
// BAD — destroys React identity, breaks hooks
const output = MyComponent({ value });

// GOOD — always use JSX
<MyComponent value={value} />
```

### 3. Never Pass Hooks Around as Values

```typescript
// BAD — compiler cannot verify Rules of Hooks
const useHook = condition ? useA : useB;

// GOOD — call hooks unconditionally at the top level
const a = useA();
const b = useB();
const value = condition ? a : b;
```

### 4. Rules of Hooks

- Call hooks at the **top level** of a component or custom hook only.
- Never inside conditions, loops, early returns, or nested functions.

### 5. What Breaks the React Compiler

The compiler will silently bail out (skip memoization) for code that:
- Mutates values after creation in a way the compiler cannot track
- Reads and writes refs during render (refs in event handlers are fine)
- Uses non-standard patterns like `arguments`, `eval`, dynamic property access on components

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

  const executeSwap = async () => {
    setLoading(true);
    try {
      // swap logic
    } finally {
      setLoading(false);
    }
  };

  return { amount, setAmount, loading, executeSwap };
};
```

### 3. Memoization (Handled by React Compiler)

The React Compiler auto-memoizes components, JSX, hooks, and expressions. **Do NOT add manual memoization to new code:**

```typescript
// DO NOT ADD to new code — compiler handles this automatically
useMemo(...)       // ← not needed
useCallback(...)   // ← not needed
React.memo(...)    // ← not needed

// GOOD — just write plain code, the compiler optimizes it
const formattedBalance = formatBalance(balance, decimals);
const handleSelect = (coin: Coin) => { setSelectedCoin(coin); };
const isDisabled = !amount;
```

> Existing `useMemo`/`useCallback` in the codebase are legacy and being removed incrementally. Do not add new ones.

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

## When to Use useEffect (and When Not To)

### Do NOT use useEffect for:

| Scenario | Use instead |
|----------|-------------|
| Derived/computed values | Plain variables or function calls during render |
| Transforming data from a query | Compute inline: `const filtered = data?.filter(...)` |
| Resetting state when a prop changes | Use a `key` on the component |
| Event-driven logic (click, submit) | Event handlers |
| Initializing global state | Module-level code or lazy state initializer |

### useEffect IS correct for:

- **External system synchronization**: DOM manipulation, subscriptions, WebSocket, timers, IntersectionObserver
- **Browser API access**: viewport dimensions, matchMedia, localStorage listeners
- **Third-party library setup/teardown**: chart libraries, analytics, SDK initialization

### Anti-pattern: Effect Chains

```typescript
// BAD — cascading effects (state A triggers effect that sets state B, which triggers another effect)
useEffect(() => { setB(computeB(a)); }, [a]);
useEffect(() => { setC(computeC(b)); }, [b]);

// GOOD — derive directly
const b = computeB(a);
const c = computeC(b);
```

---

## React 19 Features

This project uses React 19 with the React Compiler. Key features to leverage:

### React Compiler (Auto-Memoization)

Enabled via `reactCompiler: true` in `next.config.js`. Automatically memoizes components, hooks, and expressions. No manual `useMemo`/`useCallback`/`React.memo` needed.

### `ref` as a Prop (No `forwardRef`)

```typescript
// React 19 — ref is a regular prop
const Input = ({ ref, ...props }: { ref?: React.Ref<HTMLInputElement> }) => (
  <input ref={ref} {...props} />
);

// forwardRef is no longer needed
```

### Ref Cleanup Functions

```typescript
// React 19 — return a cleanup from ref callback
<div ref={(node) => {
  // setup
  return () => { /* cleanup */ };
}} />
```

### `use()` Hook

```typescript
import { use } from 'react';

// Read a context (can be called conditionally, unlike useContext)
const theme = use(ThemeContext);

// Read a promise (suspends until resolved)
const data = use(fetchPromise);
```

### Document Metadata in Components

```typescript
// React 19 — title/meta/link in any component, hoisted to <head>
const Page = () => (
  <>
    <title>My Page</title>
    <meta name="description" content="..." />
    <Content />
  </>
);
```

---

## Next.js 16 Patterns (App Router)

### 1. Server vs Client Components

| Need | Component type |
|------|---------------|
| Data fetching, DB access, secrets | Server Component (default) |
| Hooks (`useState`, `useEffect`, etc.) | Client Component (`'use client'`) |
| Event handlers (onClick, onChange) | Client Component |
| Browser APIs (localStorage, window) | Client Component |
| Static UI, layout, text | Server Component |

**`'use client'` boundary rules:**
- The directive marks the **entry point** into client-side code. All imports from that file also become client code.
- Push `'use client'` as far **down** the tree as possible to keep the server-rendered portion large.
- Server Components can render Client Components as children (composition pattern).

```typescript
// app/page.tsx — Server Component (no directive)
import { ClientWidget } from '@/components/client-widget';

const Page = () => (
  <main>
    <h1>Server-rendered heading</h1>
    <ClientWidget /> {/* Interactive island */}
  </main>
);
```

### 2. Client Components

Use `'use client'` directive for components with hooks, event handlers, or browser APIs:

```typescript
'use client';

import { useState } from 'react';

const InteractiveComponent = () => {
  const [value, setValue] = useState('');
  return <Input value={value} onChange={(e) => setValue(e.target.value)} />;
};
```

### 3. Privy Provider (Client-Only Auth)

Privy is imported directly with `'use client'` — no `next/dynamic` or `ssr: false` needed:

```typescript
// components/providers/privy-provider/index.tsx
'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';

const PrivyProviderWrapper: FC<PropsWithChildren> = ({ children }) => (
  <PrivyProvider appId={PRIVY_APP_ID} config={{
    externalWallets: { solana: { connectors: toSolanaWalletConnectors() } },
    // ...
  }}>
    {children}
  </PrivyProvider>
);
```

### 4. Path Aliases

Use `@/` prefix (configured in tsconfig.json):

```typescript
// GOOD
import { useAppState } from '@/hooks/store/use-app-state';
import { ACCENT } from '@/constants/colors';

// AVOID relative paths for deep imports
import { useAppState } from '../../../hooks/store/use-app-state';
```

### 5. Page Component Pattern

Keep pages thin, delegate to views:

```typescript
// app/page.tsx
import SwapView from '@/views/swap';

const HomePage = () => <SwapView />;

export default HomePage;
```

Layout wrapping is handled by `app/layout.tsx` (not in page components).

### 6. Metadata (instead of next/head)

```typescript
// app/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lattice',
  icons: { icon: '/icon.svg' },
};
```

### 7. API Route Handlers

All API routes use Route Handlers with Zod validation:

```typescript
// app/api/{service}/{action}/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { validateBody } from '@/lib/api/validate-params';

const schema = z.object({ /* request shape */ });

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { data, error } = validateBody(body, schema);
    if (error) return error;
    const result = await backendService(data);
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
import { useShallow } from 'zustand/react/shallow';

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

### State Structure Principles

When designing component or store state, follow these principles:

1. **Group related state**: If two state variables always change together, merge them into one object.
2. **Avoid contradictions**: Don't have `isLoading` and `isError` as separate booleans — use a `status` union (`'idle' | 'loading' | 'error' | 'success'`).
3. **Avoid redundant state**: If you can compute a value from props or other state during render, don't store it in state.
4. **Avoid duplication**: Don't store the same data in multiple state variables.
5. **Avoid deeply nested state**: Prefer flat structures — deeply nested state is hard to update immutably.

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
CHAIN_REGISTRY.sui.minGas        // 0.01
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
  /* Accent: sky-500 (dark), cyan-600 (light override in @layer base) */
  --color-accent: #0ea5e9;
  --color-accent-hover: #38bdf8;
  --color-accent-muted: #0ea5e980;
  --color-accent-subtle: #0ea5e933;
  --color-accent-wash: #0ea5e914;
  --color-accent-border: #0ea5e94d;

  /* Surfaces, text, status, component tokens... */
  --color-surface: #0a0e1a;
  --color-surface-raised: #111827;
  --color-text: #f0f0f5;
  --color-text-muted: #6b7280;
  /* ... see globals.css for full token list */
}

@layer base {
  :root { /* Complex tokens (gradients, shadows) */ }
  [data-theme="light"] { /* Light theme overrides */ }
}
```

### CSS Cascade Layers (Critical)

In Tailwind v4, all utilities live inside `@layer utilities`. **Unlayered CSS always beats layered CSS** regardless of specificity. Never add unlayered resets like `* { margin: 0; padding: 0; }` to `globals.css` — they override every Tailwind margin/padding utility. Tailwind's preflight (inside `@layer base`) already handles resets. Custom base styles must go inside `@layer base`:

```css
/* GOOD — inside a layer, overrideable by utilities */
@layer base {
  html { background: var(--color-surface); }
}

/* BAD — unlayered, overrides ALL Tailwind margin/padding utilities */
* { margin: 0; padding: 0; }
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

For runtime-dependent values (conditional colors, computed dimensions), use `style` prop with CSS variables:

```typescript
<button
  className="flex-1 p-3 rounded-lg cursor-pointer"
  style={{
    border: `1px solid ${isSelected ? 'var(--color-accent-border)' : 'var(--color-surface-border)'}`,
    background: isSelected ? 'var(--color-accent-wash)' : 'var(--color-surface-light)',
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
// BAD - hard-coded hex in className or inline style
<div className="bg-[#0ea5e9]" />
<div style={{ background: '#111827' }} />

// GOOD - use Tailwind theme classes or CSS variables
<div className="bg-accent" />
<div style={{ background: 'var(--color-toast-bg)' }} />
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

### 9. Mutating Props/State During Render

```typescript
// BAD — mutates the input array
const sorted = items.sort((a, b) => a.value - b.value);

// GOOD — use non-mutating methods
const sorted = items.toSorted((a, b) => a.value - b.value);
// or: const sorted = [...items].sort((a, b) => a.value - b.value);
```

### 10. Manual Memoization (useMemo/useCallback/React.memo)

```typescript
// BAD — React Compiler handles this automatically
const value = useMemo(() => compute(a, b), [a, b]);
const handler = useCallback(() => doThing(x), [x]);
const MemoComp = React.memo(MyComponent);

// GOOD — just write plain code
const value = compute(a, b);
const handler = () => doThing(x);
```

### 11. useEffect for Derived State

```typescript
// BAD — unnecessary effect + extra render cycle
const [fullName, setFullName] = useState('');
useEffect(() => {
  setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);

// GOOD — compute during render
const fullName = `${firstName} ${lastName}`;
```

### 12. Using `text-white` for Theme-Dependent Text

```typescript
// BAD — white text is invisible on light backgrounds
<p className="text-white">{title}</p>

// GOOD — use semantic text token (adapts to theme)
<p className="text-text">{title}</p>

// OK — text-white on colored-background buttons (always readable)
<button className="bg-accent text-white">Submit</button>
```

### 13. Inline `rgba()` Instead of CSS Variables

```typescript
// BAD — hardcoded rgba doesn't adapt to theme
style={{ background: 'rgba(0,0,0,0.7)' }}

// GOOD — use CSS variable that switches per theme
style={{ background: 'var(--color-overlay-bg)' }}
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
  CheckSVG, CheckboxSVG, ErrorSVG, InfoSVG, SearchSVG,
  CaretDownSVG, CaretUpSVG, ChevronDownSVG, ChevronRightSVG,
  ExternalLinkSVG, LogoutSVG, GridSVG, BarsSVG,
  // DeFi protocol icons
  BluefinSVG, BucketSVG, NoodlesSVG, ScallopSVG, WalSVG,
  // Pizza indicators (balance quick-select)
  PizzaPart25PercentSVG, PizzaPart50PercentSVG, PizzaPart100PercentSVG,
} from '@/components/ui/icons';
```

---

## Development Commands

```bash
pnpm dev          # Development server (port 3000, Turbopack enabled by default in Next.js 16)
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Biome check
pnpm lint:fix     # Biome auto-fix
pnpm format       # Biome format
pnpm typecheck    # TypeScript type check (tsc --noEmit)
pnpm verify       # Runs lint + typecheck
pnpm test         # Vitest watch mode
pnpm test:run     # Vitest single run (CI)
```

Git hooks are managed by Husky (`prepare: husky`).

---

## Important Project Notes

1. **Package Manager**: pnpm (9.1.0, pinned)
2. **Node Version**: >=18.17
3. **React Compiler**: Enabled via `reactCompiler: true` in `next.config.js` — auto-memoizes components
4. **Active Views**: `views/swap` (Swap + Bridge tabs) and `views/account` (Balances + Deposit + Withdraw)
5. **Commit Style**: Gitmoji convention via commitlint

### Removed Features (Do Not Recreate)

- Portfolio view
- DeFi integrations view
- Statistics view
- Staking features (Stake, Unstake, Transmute, Epoch)

---

## Design System

### Theme Architecture

The app supports **light + dark themes** with system preference as default. Powered by `next-themes`:

- **Theme provider**: `components/providers/theme-provider/index.tsx`
- **Storage key**: `lattice-theme` (localStorage)
- **HTML attribute**: `data-theme="light" | "dark"`
- **Settings UI**: Theme selector in Settings menu (System / Dark / Light)

### Token Naming Convention

All design tokens follow `--color-{category}-{variant}` for simple colors and `--{component}-{property}` for complex values (gradients, shadows).

**Simple color tokens** (in `@theme`, generate Tailwind utilities like `bg-accent`, `text-text-muted`):
- Accent: `accent`, `accent-hover`, `accent-muted`, `accent-subtle`, `accent-wash`, `accent-border`
- Surface: `surface`, `surface-raised`, `surface-overlay`, `surface-inset`, `surface-light`, `surface-lighter`, `surface-hover`, `surface-border`, `surface-border-hover`
- Text: `text`, `text-secondary`, `text-muted`, `text-dimmed`, `text-dim`
- Status: `success`, `error`, `warning`
- Component: `toast-bg`, `toast-border`, `toast-success`, `toast-error`, `modal-border`, `overlay-bg`, `footer-bg`, `header-border`, `toggle-inactive`, `toggle-thumb`, `toggle-thumb-disabled`, `tooltip-text`, `skeleton-base`, `skeleton-highlight`, `scrollbar-track`, `scrollbar-thumb`, `warning-bg`, `warning-border`, `error-wash`

**Complex tokens** (in `@layer base :root` / `[data-theme="light"]`, used as `var(--token-name)` in inline styles):
- `--toast-shadow`, `--toast-success-glow`, `--toast-error-glow`
- `--modal-bg`, `--modal-shadow`, `--settings-shadow`
- `--btn-primary-bg`, `--btn-primary-shadow`
- `--card-bg`, `--card-shadow`
- `--tooltip-shadow`, `--bg-blur`

### Color Palette Identity

| Theme | Accent | Surfaces | Text |
|-------|--------|----------|------|
| **Dark** | Sky-500 `#0ea5e9` | Navy (`#0a0e1a` → `#1a2233`) | White scale (`#f0f0f5` → `#404759`) |
| **Light** | Cyan-600 `#0891b2` (WCAG AA) | Slate (`#f8fafc` → `#e2e8f0`) | Slate (`#0f172a` → `#94a3b8`) |

### How to Use Tokens

| Context | Method | Example |
|---------|--------|---------|
| **Tailwind classes** | Use utility classes | `bg-surface`, `text-text-muted`, `border-accent` |
| **Inline styles** (simple) | `var(--color-*)` | `style={{ color: 'var(--color-accent)' }}` |
| **Inline styles** (complex) | `var(--*)` | `style={{ background: 'var(--card-bg)' }}` |
| **JS-only** (canvas, third-party) | `useThemeColors()` hook | `const { particlePalette, isDark } = useThemeColors()` |
| **Theme detection** | `useTheme()` from `next-themes` | `const { theme, setTheme, resolvedTheme } = useTheme()` |

### Rules

1. **Never use hardcoded hex colors** in components — always use CSS variables or Tailwind theme classes
2. **Use `text-text`** for theme-dependent text, not `text-white` (exception: text on colored-background buttons)
3. **Status colors** (`success`, `error`, `warning`) are semantic — only use them for their intended purpose
4. **Component tokens** (`toast-bg`, `modal-bg`, etc.) are scoped — only use them in their intended component
5. **Chain brand colors** in `constants/chains/` are intentionally theme-independent (they represent external brands)

---

## Quick Reference

### Imports Template

```typescript
// React
import { FC, useState, useEffect, useRef } from 'react';

// Next.js
import Image from 'next/image';
import { usePathname } from 'next/navigation';

// Theme
import { useTheme } from 'next-themes';
import useThemeColors from '@/hooks/ui/use-theme-colors';

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

**Last Updated**: 2026-02-11
**Active Views**: `views/swap` and `views/account`
**Main Features**: Cross-chain SUI/SOL token swapping
