# Architecture Guide - Lattice UI

## System Overview

**Lattice UI** (package: `lattice-ui` v1.1.0) is a DeFi cross-chain swap application enabling token exchanges between the **Sui** and **Solana** blockchains. Users can swap SUI for SOL (and vice versa), bridge tokens across chains, and manage wallet balances.

### Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16 |
| Language | TypeScript (strict mode) | 5.9 |
| UI | React | 19 |
| Styling | Tailwind CSS | v4 |
| Animation | Framer Motion (`motion/react`) | 12.3 |
| Global State | Zustand | 5.0 |
| Server State | TanStack Query | v5 |
| Forms | React Hook Form | 7.54 |
| Wallet Auth | Privy | 3.13 |
| Testing | Vitest + React Testing Library | 4.0 |
| Linting | Biome | 2.3 |
| Analytics | Vercel Analytics | 1.6 |
| Package Manager | pnpm | 9.1.0 |

### Blockchain SDKs

| SDK | Purpose |
|-----|---------|
| `@mysten/sui` | Sui RPC client |
| `@solana/kit` | Solana RPC + SPL tokens |
| `@interest-protocol/enclave-sdk` | TEE-based signing enclave |
| `@interest-protocol/xswap-sdk` | Cross-chain swap protocol |
| `@interest-protocol/xbridge-sdk` | Cross-chain bridge protocol |
| `@interest-protocol/registry-sdk` | On-chain registry |
| `@interest-protocol/xcore-sdk` | Core protocol utilities |

---

## Directory Structure

```
lattice-ui/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout (fonts, metadata, providers)
│   ├── page.tsx                # Home → SwapView
│   ├── providers.tsx           # Provider composition tree
│   ├── globals.css             # Global styles
│   ├── account/
│   │   └── page.tsx            # Account → AccountView
│   └── api/                    # API routes (18 endpoints)
│       ├── enclave/            # Enclave proxy (1 route)
│       ├── solver/             # Solver proxy (4 routes)
│       ├── xswap/              # Cross-chain swap (1 route)
│       ├── xbridge/            # Bridge operations (4 routes)
│       ├── wallet/             # Wallet management (5 routes)
│       ├── health/             # Health checks (2 routes)
│       └── external/           # External API proxy (1 route)
│
├── components/                 # React components (4 layers)
│   ├── composed/               # Feature-rich composed components
│   │   ├── footer/             # App footer
│   │   ├── header/             # App header + navbar
│   │   ├── health-indicator/   # Service health display
│   │   ├── input-field/        # Token input with asset selector
│   │   ├── settings/           # Settings menu (RPC, explorer)
│   │   └── wallet-button/      # Wallet connection UI
│   ├── layout/                 # Page structure
│   │   ├── layout/             # Main page wrapper + mouse tracking
│   │   └── background/         # Animated blur + particle background
│   ├── providers/              # Context/state providers
│   │   ├── app-state-provider/ # Zustand hydration
│   │   ├── error-boundary/     # React error boundary
│   │   ├── modal-provider/     # Global modal system
│   │   ├── privy-provider/     # Wallet auth (SSR disabled)
│   │   └── wallet-registration-provider/  # Auto wallet setup
│   └── ui/                     # Reusable UI primitives
│       ├── icons/              # 26+ SVG icon components
│       ├── motion/             # Framer Motion wrapper
│       ├── tabs/               # Tab navigation
│       ├── toast/              # Toast notification system
│       ├── toggle/             # Custom toggle switch
│       └── tooltip/            # Icon tooltip
│
├── constants/                  # App-wide constants (13 files)
│   ├── index.ts                # Barrel export
│   ├── colors.ts               # ACCENT color palette
│   ├── coins.ts                # Token metadata (ASSET_METADATA)
│   ├── routes.ts               # Route definitions
│   ├── storage-keys.ts         # localStorage keys
│   ├── network.ts              # Network enum (mainnet)
│   ├── rpc.ts                  # RPC provider config
│   ├── explorer.ts             # Block explorer URLs
│   ├── bridged-tokens.ts       # XBridge token metadata
│   ├── toast.tsx               # Toast duration
│   └── chains/                 # Chain registry
│       ├── chain.types.ts      # ChainConfig interface
│       ├── chain-tokens.ts     # Token options per chain
│       └── index.ts            # CHAIN_REGISTRY
│
├── hooks/                      # Custom React hooks (24 files)
│   ├── store/                  # Zustand stores
│   │   ├── use-app-state/      # Global app state
│   │   ├── use-modal/          # Modal content/animation
│   │   └── use-network/        # Network config (mainnet)
│   ├── blockchain/             # Chain-specific data fetching
│   │   ├── use-sui-client/     # Sui RPC client (configurable)
│   │   ├── use-sui-balances/   # SUI + wSOL balances
│   │   ├── use-sui-price/      # SUI token price
│   │   ├── use-sol-price/      # SOL token price
│   │   ├── use-token-prices/   # Combined price hook
│   │   ├── use-solana-connection/ # Solana RPC connection
│   │   └── use-solana-balances/   # SOL + wSUI balances
│   ├── domain/                 # Business logic
│   │   ├── use-swap/           # Cross-chain swap orchestration
│   │   ├── use-bridge/         # Token bridge orchestration
│   │   ├── use-wallet-addresses/     # Address extraction
│   │   ├── use-wallet-registration/  # Auto wallet setup
│   │   ├── use-metadata/       # Asset metadata lookup
│   │   ├── use-health/         # Service health monitoring
│   │   └── use-get-explorer-url/     # Explorer URL builder
│   └── ui/                     # Component utilities
│       ├── use-event-listener/ # Generic event binding
│       ├── use-click-outside-listener-ref/ # Click-outside detection
│       ├── use-background-position/        # Background translate
│       ├── use-background-motion-position/ # Background motion values
│       └── use-safe-height/    # Mobile viewport height
│
├── lib/                        # Core business logic (37 files)
│   ├── config.ts               # Environment variables
│   ├── api/                    # API utilities
│   │   ├── client.ts           # Fetch wrapper
│   │   └── validate-params.ts  # Zod request validation
│   ├── chain-adapters/         # Chain abstraction layer
│   │   ├── chain-adapter.types.ts  # ChainAdapter interface
│   │   ├── sui-adapter.ts      # Sui deposit/balance adapter
│   │   ├── solana-adapter.ts   # Solana deposit/balance adapter
│   │   ├── sdk-mapping.ts      # ChainKey → SDK chain ID
│   │   └── index.ts            # Barrel export
│   ├── entities/               # DeFi domain entities
│   │   ├── token.ts            # Token class (SUI, SOL singletons)
│   │   ├── currency-amount.ts  # CurrencyAmount (token + raw amount)
│   │   ├── fraction.ts         # Fraction + Rounding enum
│   │   ├── percent.ts          # Percent (extends Fraction)
│   │   ├── fixed-point-math.ts # Decimal conversion
│   │   ├── trade.ts            # Trade entity
│   │   └── index.ts            # Barrel export
│   ├── enclave/                # Enclave SDK wrapper
│   │   ├── client.ts           # API calls
│   │   ├── sdk.ts              # SDK initialization
│   │   └── index.ts            # Barrel export
│   ├── solver/                 # Solver API client
│   │   └── client.ts           # API calls
│   ├── xswap/                  # Cross-chain swap SDK
│   │   ├── client.ts           # Swap API calls
│   │   ├── sdk.ts              # SDK initialization
│   │   └── index.ts            # Barrel export
│   ├── xbridge/                # Bridge SDK
│   │   ├── client.ts           # Bridge API calls
│   │   ├── sdk.ts              # SDK initialization
│   │   └── index.ts            # Barrel export
│   ├── privy/                  # Privy server-side
│   │   ├── server.ts           # Privy Node client
│   │   ├── signing.ts          # Transaction signing
│   │   └── wallet.ts           # Wallet creation/linking
│   ├── registry/               # On-chain registry
│   │   ├── client.ts           # Registry API calls
│   │   ├── sdk.ts              # SDK initialization
│   │   └── index.ts            # Barrel export
│   ├── wallet/                 # Wallet operations
│   │   └── client.ts           # Send tokens, create/link wallets
│   ├── solana/                 # Solana helpers
│   │   ├── server.ts           # Server-side Solana client
│   │   └── confirm-transaction.ts  # Transaction confirmation
│   ├── sui/                    # Sui helpers
│   │   └── client.ts           # Server-side Sui client
│   ├── bigint-utils.ts         # BigInt formatting utilities
│   └── external/               # External API clients
│       └── client.ts           # Price fetching (Pyth)
│
├── views/                      # Page-level view components
│   ├── swap/                   # Main swap interface
│   │   ├── index.tsx           # Page wrapper
│   │   ├── swap-content.tsx    # Tab orchestration
│   │   └── components/
│   │       ├── swap/           # Swap tab
│   │       │   ├── index.tsx
│   │       │   ├── swap-form/
│   │       │   │   ├── index.tsx
│   │       │   │   └── swap-form-button/
│   │       │   └── swap-details/
│   │       └── bridge/         # Bridge tab
│   │           ├── index.tsx
│   │           ├── bridge-form.tsx
│   │           ├── bridge-button.tsx
│   │           ├── bridge-details.tsx
│   │           ├── bridge-network-selector.tsx
│   │           └── bridge.types.ts
│   └── account/                # Account management
│       ├── index.tsx
│       ├── account-content.tsx
│       └── components/
│           ├── deposit-view.tsx
│           ├── withdraw-view.tsx
│           ├── deposit-modal.tsx
│           ├── send-modal.tsx
│           └── network-tabs.tsx
│
├── utils/                      # Pure utility functions (7 files)
│   ├── index.ts                # Barrel export
│   ├── bn.ts                   # BigInt helpers
│   ├── money.ts                # Number formatting (Intl)
│   ├── number.ts               # Input parsing/sanitization
│   ├── format-address.ts       # Address truncation
│   ├── extract-error-message.ts # Error message extraction
│   └── gas-validation.ts       # Validation logic
│
├── interface/                  # Shared TypeScript types
│   └── index.ts                # AssetMetadata, Node, SdkPool
│
└── public/                     # Static assets
    ├── bg.png                  # Background image
    ├── icon.svg                # Favicon
    └── ...                     # Token icons, images
```

---

## Layered Architecture

### Component Layers

The component hierarchy follows a 4-layer pattern with clear dependency rules:

```
┌─────────────────────────────────────────────┐
│  Providers   (error boundary, auth, state)  │  ← Wraps everything
├─────────────────────────────────────────────┤
│  Layout      (page wrapper, background)     │  ← Page structure
├─────────────────────────────────────────────┤
│  Composed    (header, input-field, wallet)  │  ← Feature components
├─────────────────────────────────────────────┤
│  UI          (icons, tabs, toast, toggle)   │  ← Atomic primitives
└─────────────────────────────────────────────┘
```

**Rules:**
- UI components have zero business logic and no hook dependencies beyond React
- Composed components may use hooks and reference UI components
- Layout components orchestrate composed components
- Providers are side-effect wrappers that return `null` or wrap children

### Hook Layers

```
┌─────────────────────────────────────────────┐
│  Domain      (use-swap, use-bridge, etc.)   │  ← Business orchestration
├─────────────────────────────────────────────┤
│  Blockchain  (use-sui-*, use-solana-*)      │  ← Chain data fetching
├─────────────────────────────────────────────┤
│  Store       (use-app-state, use-modal)     │  ← Zustand global state
├─────────────────────────────────────────────┤
│  UI          (use-event-listener, etc.)     │  ← Component utilities
└─────────────────────────────────────────────┘
```

**Rules:**
- Domain hooks compose blockchain + store hooks
- Blockchain hooks are independent of each other
- Store hooks are pure Zustand stores
- UI hooks have no business logic

### Lib Layer

```
┌─────────────────────────────────────────────┐
│  Chain Adapters  (sui-adapter, solana-...)   │  ← Abstraction layer
├─────────────────────────────────────────────┤
│  Entities  (Token, CurrencyAmount, Trade)   │  ← Domain models
├─────────────────────────────────────────────┤
│  SDK Wrappers  (enclave, xswap, xbridge)    │  ← Protocol clients
├─────────────────────────────────────────────┤
│  Infrastructure  (api, privy, swr, config)  │  ← Low-level utilities
└─────────────────────────────────────────────┘
```

---

## Data Flow

### State Management Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   localStorage   │◄───►│  Zustand Stores  │◄───►│  React State    │
│  (RPC, Explorer, │     │  (useAppState,   │     │  (forms, local  │
│   wallet flags)  │     │   useModal)      │     │   component)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               ▲
                               │ useShallow selectors
                               ▼
                        ┌──────────────────┐     ┌─────────────────┐
                        │  TanStack Query  │◄───►│  API Routes     │
                        │  (balances,      │     │  (server-side   │
                        │   prices, health)│     │   SDK calls)    │
                        └──────────────────┘     └─────────────────┘
```

**State types:**
- **Zustand** — Global app state (balances, loading flags, modal content)
- **TanStack Query** — Server-state cache with 30-60s refetch intervals
- **React Hook Form** — Swap/bridge form state with BigInt values
- **localStorage** — User preferences (RPC, explorer, wallet registration flags)
- **URL** — Page routing via App Router (`/`, `/account`)

### Swap Flow (User Action → Blockchain)

```
User enters amount
    │
    ▼
React Hook Form (swap-form/index.tsx)
    │ validates via useMemo
    ▼
SwapFormButton enables/disables
    │ onClick
    ▼
useSwap hook orchestrates:
    │
    ├─ 1. Validate wallets (useWalletAddresses)
    ├─ 2. Get chain adapter (createSuiAdapter / createSolanaAdapter)
    ├─ 3. Deposit funds → source chain
    ├─ 4. Confirm deposit tx
    ├─ 5. Fetch proof → /api/enclave/new-request
    ├─ 6. Fetch solver metadata → /api/solver/metadata
    ├─ 7. Encode addresses (chain adapter)
    ├─ 8. Create swap request → /api/xswap/create-request
    └─ 9. Poll destination balance (5s intervals, max 24 attempts)
         │
         ▼
    Toast notification (success/error)
    TanStack Query cache invalidation (invalidateQueries)
```

---

## API Routes

All 18 API routes are Next.js Route Handlers (`app/api/**/route.ts`) that proxy to backend services. Each validates inputs with **Zod** schemas.

### Enclave Service

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/enclave/new-request` | POST | Create proof request for swap verification |

### Solver Service

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/solver/fulfill` | POST | Fulfill a swap order |
| `/api/solver/metadata` | GET | Get solver addresses and configuration |
| `/api/solver/prices` | GET | Get current swap prices |
| `/api/solver/status` | GET | Check solver order status |

### Cross-Chain Swap

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/xswap/create-request` | POST | Create a cross-chain swap request |

### Bridge (XBridge)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/xbridge/create-mint-request` | POST | Initiate bridge mint |
| `/api/xbridge/set-mint-digest` | POST | Set transaction digest for mint |
| `/api/xbridge/vote-mint` | POST | Vote on bridge mint via enclave |
| `/api/xbridge/execute-mint` | POST | Execute finalized bridge mint |

### Wallet Management

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/wallet/create-sui` | POST | Create embedded Sui wallet |
| `/api/wallet/create-solana` | POST | Create embedded Solana wallet |
| `/api/wallet/link-solana` | POST | Link Solana wallet to Sui account |
| `/api/wallet/send-sui` | POST | Send SUI tokens |
| `/api/wallet/send-solana` | POST | Send SOL tokens |

### Health

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/health/enclave` | GET | Enclave service health check |
| `/api/health/solver` | GET | Solver service health check |

### External

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/external/prices` | GET | Fetch token prices from Pyth oracle |

---

## Blockchain Integration

### Chain Adapter Pattern

The codebase abstracts chain-specific operations behind a unified `ChainAdapter` interface:

```
ChainAdapter (interface)
├── createSuiAdapter(suiClient, mutate)
│   ├── deposit(params) → txDigest
│   ├── refetchBalance() → balances
│   ├── getBalanceForPolling(balances) → bigint
│   └── encodeAddress(address) → Uint8Array
│
└── createSolanaAdapter(connection, mutate)
    ├── deposit(params) → txSignature
    ├── refetchBalance() → balances
    ├── getBalanceForPolling(balances) → bigint
    └── encodeAddress(address) → Uint8Array
```

This enables the `useSwap` hook to operate chain-agnostically.

### SDK Chain ID Mapping

```typescript
// lib/chain-adapters/sdk-mapping.ts
CHAIN_KEY_TO_SDK_ID: Record<ChainKey, SupportedChainId>
sdkChainIdFromKey(key: ChainKey): SupportedChainId
```

### Wallet Flow (Privy)

```
App loads
    │
    ▼
PrivyProvider initializes (SSR disabled via dynamic import)
    │
    ▼
WalletRegistrationProvider (side-effect provider):
    │
    ├─ Step 1: Check if wallets registered (localStorage flag)
    │   ├─ Create Sui wallet if missing → /api/wallet/create-sui
    │   └─ Create Solana wallet if missing → /api/wallet/create-solana
    │   └─ Retry with exponential backoff [2s, 5s, 10s]
    │
    └─ Step 2: Check if wallets linked (localStorage flag)
        └─ Link Solana → Sui → /api/wallet/link-solana
        └─ Same retry mechanism
    │
    ▼
useWalletAddresses extracts addresses from Privy user object
    │ Fallback: chainType detection → address format matching
    ▼
Wallet ready for transactions
```

---

## DeFi Entities

The `lib/entities/` directory implements a domain-driven type system for financial calculations:

### Token

Immutable value object representing a blockchain token.

- Pre-defined singletons: `Token.SUI`, `Token.SOL`
- Factory: `Token.fromType(coinType)` with lazy lookup
- Identity: `equals()`, `isSui()`, `isSol()`
- Bridge: `toAssetMetadata()` for UI rendering

### CurrencyAmount

Amount + Token pair with safe arithmetic.

- **Private constructor** — must use factories:
  - `CurrencyAmount.fromRawAmount(token, rawBigInt)`
  - `CurrencyAmount.fromHumanAmount(token, "1.5")`
  - `CurrencyAmount.zero(token)`
- Arithmetic: `add()`, `subtract()`, `multiply()`
- Comparisons: `greaterThan()`, `lessThan()`, `exceedsBalance()`
- Display: `toExact()`, `toFixed(dp)`, `toSignificant(sig)`

### Fraction

Base class for rational number representation.

- Numerator + denominator as bigint
- `Rounding` enum: `ROUND_DOWN`, `ROUND_HALF_UP`, `ROUND_UP`
- Arithmetic + comparison operations

### Percent

Extends Fraction for percentage values (e.g., slippage, fees).

### FixedPointMath

Static utility for decimal ↔ raw amount conversion.

- `parseUnits(value, decimals)` — human → raw
- `toNumber(rawBN, decimals)` — raw → human

### Trade

Represents a swap trade with input/output amounts and execution price.

---

## Provider Composition

The provider tree in `app/providers.tsx` wraps all pages:

```
ErrorBoundary
  └── PrivyProviderWrapper (dynamic, ssr: false)
        ├── ModalProvider (global modal overlay)
        ├── Toaster (react-hot-toast, bottom-right)
        └── SkeletonTheme (loading placeholders)
              ├── AppStateProvider (Zustand hydration)
              ├── WalletRegistrationProvider (auto wallet setup)
              ├── BackgroundProvider (parallax background init)
              └── {children} (page content)
```

Additionally, the root `layout.tsx` wraps everything in:
```
<html>
  <body>
    <Providers>
      {children}
    </Providers>
    <Analytics />  (Vercel)
  </body>
</html>
```

---

## Key Design Patterns

### 1. Registry + Adapter Pattern

Chain-specific configuration is centralized in `CHAIN_REGISTRY`, and runtime behavior is delegated to chain adapters:

```typescript
// constants/chains/index.ts
export const CHAIN_REGISTRY: Record<ChainKey, ChainConfig> = {
  sui: { displayName: 'Sui', color: '#4DA2FF', alphaMax: 0.1, minGas: 0.01, ... },
  solana: { displayName: 'Solana', color: '#9945FF', alphaMax: 0.001, minGas: 0.00001, ... },
};

// lib/chain-adapters/
const adapter = chainKey === 'sui' ? createSuiAdapter(...) : createSolanaAdapter(...);
await adapter.deposit(params);
```

### 2. Composition over Prop Drilling

Views use a container/presenter split:

```
Bridge (orchestrator) → BridgeForm (presenter)
                      → BridgeDetails (presenter)
                      → BridgeButton (smart button)
```

### 3. Zustand Selector Pattern with useShallow

Prevents unnecessary re-renders by selecting only needed state:

```typescript
const { update, loadingCoins } = useAppState(
  useShallow((s) => ({ update: s.update, loadingCoins: s.loadingCoins }))
);
```

### 4. Side-Effect Provider Pattern

Providers that run effects but render nothing:

```typescript
// AppStateProvider, WalletRegistrationProvider, BackgroundProvider
const Provider = () => {
  useEffect(() => { /* side effects */ }, []);
  return null;
};
```

### 5. Factory Pattern for Toasts

Custom toast factory provides consistent notification styling:

```typescript
toasting.success({ action: 'Swap', message: 'Transaction confirmed!' });
toasting.error({ action: 'Bridge', message: 'Insufficient balance' });
toasting.loading({ message: 'Confirming transaction...' }, toastId);
```

### 6. TanStack Query with Conditional Fetching

Data fetching hooks conditionally skip when dependencies are missing:

```typescript
const { data } = useQuery({
  queryKey: ['sui-balances', address],
  queryFn: () => fetchBalances(address!),
  enabled: !!address,  // skip when address is null
  refetchInterval: 30_000,
});
```

### 7. Zod Validation on All API Routes

Every API route validates request parameters:

```typescript
// lib/api/validate-params.ts
const { data, error } = validateBody(requestBody, schema);
// Returns 400 with error details if validation fails
```

---

## Environment Configuration

All secrets and service URLs are externalized via environment variables:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_PRIVY_APP_ID` | Privy authentication app ID |
| `NEXT_PUBLIC_ENCLAVE_URL` | TEE enclave service URL |
| `NEXT_PUBLIC_SOLVER_API_URL` | Solver/market-maker API URL |
| `NEXT_PUBLIC_SUI_RPC_URL` | Sui RPC endpoint (fallback: mainnet fullnode) |

---

*Last updated: 2026-02-11*
