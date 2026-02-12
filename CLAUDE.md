# Winter Walrus (Lattice UI) - Project Guide

## Project Overview

**Winter Walrus** is a DeFi application that provides cross-chain swap functionality between SUI and SOL tokens. Users can seamlessly exchange assets across the Sui and Solana blockchains.

- **Tech Stack**: Next.js 16 (App Router + Turbopack), TypeScript 5.9 (strict), React 19 + React Compiler, Framer Motion (`motion/react`), Tailwind CSS v4
- **Blockchains**: Sui Network & Solana
- **Wallet**: Privy developer-owned server wallets (wallet mapping via `custom_metadata`)
- **State**: Zustand for global state, TanStack Query v5 for server state, React Hook Form for forms
- **Styling**: Tailwind CSS v4 (utility-first, configured via `@theme` in `globals.css`)
- **Linting**: Biome 2.3 (not ESLint/Prettier)
- **Testing**: Vitest + React Testing Library
- **React Compiler**: Enabled via `reactCompiler: true` in `next.config.js` — auto-memoizes components, hooks, and expressions. **Do NOT add `useMemo`, `useCallback`, or `React.memo`** to new code.

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

## Next.js 16 Patterns

### Page Component Pattern

Keep pages thin, delegate to views:

```typescript
// app/page.tsx
import SwapView from '@/views/swap';
const HomePage = () => <SwapView />;
export default HomePage;
```

Layout wrapping is handled by `app/layout.tsx` (not in page components).

### API Route Handlers

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

### Privy Provider (Client-Only Auth)

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

---

## State Management

### Zustand (Global State)

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

**Always use `useShallow` selectors** (prevents unnecessary re-renders):

```typescript
import { useShallow } from 'zustand/react/shallow';

const { update, loadingCoins } = useAppState(
  useShallow((s) => ({ update: s.update, loadingCoins: s.loadingCoins }))
);

// Simple single-value selector is also fine:
const balances = useAppState((state) => state.balances);
```

### TanStack Query v5 (Server State)

```typescript
const { data, error, isLoading } = useQuery({
  queryKey: ['suiBalances', address],
  queryFn: async () => { /* fetch logic */ },
  enabled: !!address,
  refetchInterval: 30_000,
  staleTime: 5_000,
  refetchOnWindowFocus: false,
});

// Invalidate:
queryClient.invalidateQueries({ queryKey: ['suiBalances'] });
```

`QueryClientProvider` is set up in `app/providers.tsx`.

---

## DeFi Entities (lib/entities/)

### Token

```typescript
import { Token } from '@/lib/entities';

Token.SUI               // Pre-defined singleton
Token.SOL
Token.fromType(coinType) // From coin type string
token.symbol             // 'SUI'
token.decimals           // 9
token.isSui()            // true
```

### CurrencyAmount

```typescript
import { CurrencyAmount, Token } from '@/lib/entities';

CurrencyAmount.fromRawAmount(Token.SUI, rawBigNumber)  // From blockchain amount
CurrencyAmount.fromHumanAmount(Token.SUI, '1.5')       // From user input
CurrencyAmount.zero(Token.SUI)                          // Zero

// Arithmetic: .add(other), .subtract(other), .multiply(factor)
// Display: .toExact(), .toFixed(4), .toSignificant(4)
// Comparisons: .greaterThan(other), .exceedsBalance(balance), .isZero()
```

### FixedPointMath

```typescript
import { FixedPointMath } from '@/lib/entities';
FixedPointMath.toBigNumber(1.5, 9)  // Human → raw: 1500000000
FixedPointMath.toNumber(rawBN, 9)   // Raw → human: 1.5
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

## Styling with Tailwind CSS v4

### CSS Cascade Layers (Critical)

Tailwind v4 is configured via CSS (`app/globals.css`), not `tailwind.config.js`. All utilities live inside `@layer utilities`. **Unlayered CSS always beats layered CSS** regardless of specificity. Never add unlayered resets like `* { margin: 0; }` to `globals.css`. Custom base styles must go inside `@layer base`:

```css
/* GOOD — inside a layer, overrideable by utilities */
@layer base {
  html { background: var(--color-surface); }
}

/* BAD — unlayered, overrides ALL Tailwind utilities */
* { margin: 0; padding: 0; }
```

### Dynamic Styles

For runtime-dependent values, use `style` prop with CSS variables:

```typescript
<button
  className="flex-1 p-3 rounded-lg cursor-pointer"
  style={{
    border: `1px solid ${isSelected ? 'var(--color-accent-border)' : 'var(--color-surface-border)'}`,
    background: isSelected ? 'var(--color-accent-wash)' : 'var(--color-surface-light)',
  }}
>
```

---

## DeFi-Specific Patterns

### BigInt Handling

Token amounts use native `bigint`:

```typescript
import { parseUnits, formatUnits } from '@/lib/bigint-utils';

const raw = parseUnits('1.5', 9);      // 1500000000n
const display = formatUnits(raw, 9);   // '1.5'
const total = amount + fee;
```

### Transaction Status Pattern

```typescript
type SwapStatus = 'idle' | 'depositing' | 'verifying' | 'creating' | 'waiting' | 'success' | 'error';
const [status, setStatus] = useState<SwapStatus>('idle');

const execute = async () => {
  try {
    setStatus('depositing');
    // ... deposit
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

toasting.success({ action: 'Swap', message: 'Confirmed!', link: explorerUrl });
toasting.error({ action: 'Bridge', message: 'Insufficient balance' });
toasting.loading({ message: 'Confirming transaction...' }, toastId);
toasting.dismiss(toastId);
```

---

## Wallet Integration (Privy)

### Architecture: Developer-Owned Server Wallets

This project uses **developer-owned** (server) wallets, NOT user-owned wallets. This is a critical architectural decision:

| Aspect | User-Owned | Developer-Owned (ours) |
|--------|-----------|----------------------|
| `create()` call | `{ chain_type, owner: { user_id } }` | `{ chain_type }` (no `owner`) |
| Server-side signing | Requires user JWT/session (401 for dev auth keys) | Developer auth key is sufficient |
| Solana `signMessage` via `/rpc` | 401 — dev auth keys rejected | Works with dev auth keys |
| Solana `rawSign` via `/raw_sign` | 400 — "solana wallets not supported" | 400 — still not supported (use `signMessage`) |
| Wallet lookup | `wallets().list({ user_id })` | `custom_metadata` on Privy user |

### Wallet ↔ User Mapping via `custom_metadata`

Since developer-owned wallets have no `owner`, we store the mapping in Privy user `custom_metadata`:

```typescript
// Metadata keys stored per user:
{
  suiWalletId: string,      // Privy wallet ID
  suiAddress: string,       // On-chain address
  solanaWalletId: string,   // Privy wallet ID
  solanaAddress: string,    // On-chain address (base58)
}
```

Core functions in `lib/privy/wallet.ts`:
- `getOrCreateWallet(privy, userId, chainType)` — Looks up metadata first, creates if missing
- `getFirstWallet(privy, userId, chainType)` — Metadata lookup only, throws `WalletNotFoundError`
- `storeWalletMetadata(privy, userId, chainType, wallet)` — Merges into existing metadata

### Privy Node SDK API Surface

```typescript
// User lookup (by Privy user ID like "did:privy:...")
const user = await privy.users()._get(userId);
// NOTE: privy.users().get() only accepts { id_token }, NOT a string userId

// Store metadata (reads existing + merges)
await privy.users().setCustomMetadata(userId, {
  custom_metadata: { ...existing, newKey: 'value' },
});

// Wallet creation (developer-owned — no owner field)
const wallet = await privy.wallets().create({ chain_type: 'sui' });

// Wallet lookup by ID
const wallet = await privy.wallets().get(walletId);

// Solana signing (first-class chain — use chain-specific methods)
const result = await privy.wallets().solana().signMessage(walletId, {
  message: messageBytes,  // Uint8Array or base64 string
  authorization_context: { authorization_private_keys: [AUTH_KEY] },
});
// Returns: { encoding: 'base64', signature: string }

// Sui signing (curve-signing chain — use rawSign)
const result = await privy.wallets().rawSign(walletId, {
  params: {
    bytes: base64EncodedBytes,
    encoding: 'base64',
    hash_function: 'blake2b256',
  },
  authorization_context: { authorization_private_keys: [AUTH_KEY] },
});
// Returns: { encoding: 'hex', signature: string }
```

### Privy Chain Classification

| Classification | Chains | Signing Method |
|---------------|--------|---------------|
| **First-Class** | Ethereum, Solana | Chain-specific methods: `.ethereum().signMessage()`, `.solana().signAndSendTransaction()` |
| **Curve-Signing** | Sui, Aptos, Cosmos, Stellar, etc. | Generic `rawSign()` only |

**Sui has NO chain-specific Privy service** (no `.sui().signTransaction()`). All Sui signing goes through `rawSign`.

### Sui Transaction Signing (via `rawSign`)

Sui transaction signing requires manually replicating what the Sui SDK does internally:

```typescript
// 1. Build intent message (3-byte prefix + raw tx bytes)
const intentMessage = messageWithIntent('TransactionData', rawBytes);

// 2. Use Bytes variant — let Privy hash with blake2b256 and sign
const signResult = await privy.wallets().rawSign(walletId, {
  params: {
    bytes: Buffer.from(intentMessage).toString('base64'),
    encoding: 'base64',
    hash_function: 'blake2b256',  // Sui uses blake2b-256
  },
  authorization_context: authorizationContext,
});

// 3. Strip 0x prefix from hex signature (Privy may include it)
const sigHex = signResult.signature.replace(/^0x/, '');
const signatureBytes = Uint8Array.from(Buffer.from(sigHex, 'hex'));

// 4. Extract public key from wallet (Privy returns hex with flag byte prefix)
const publicKey = extractPublicKey(walletInfo.public_key);

// 5. Build serialized signature for Sui
const serializedSignature = toSerializedSignature({
  signature: signatureBytes,
  signatureScheme: 'ED25519',
  publicKey,
});

// 6. Execute
await suiClient.executeTransactionBlock({
  transactionBlock: Buffer.from(rawBytes).toString('base64'),
  signature: serializedSignature,
});
```

### Solana-to-Sui Cross-Chain Signature (Link Solana)

The `linkSolana` flow signs a message with the **Solana** wallet and passes that signature into a **Sui** transaction for on-chain Ed25519 verification:

```typescript
// 1. Create the message the on-chain contract expects
const messageBytes = Registry.createSolanaLinkMessage(suiAddress);
// → Uint8Array of "Link Solana to Sui: <hex_address_without_0x>"

// 2. Sign with Solana wallet (standard Ed25519, no prefix)
const signResult = await privy.wallets().solana().signMessage(walletId, {
  message: messageBytes,  // Pass Uint8Array directly
  authorization_context: { ... },
});

// 3. On-chain, Sui's ed25519_verify(signature, pubkey, message) verifies it
```

Reference implementation: `core/scripts/src/setup/1-user-registers-solana.ts` uses `nacl.sign.detached()`.

### Basic Client Usage

```typescript
import { usePrivy } from '@privy-io/react-auth';
const { login, logout, authenticated, user, ready } = usePrivy();
```

### Getting Wallet Addresses

Use the project's custom hook (reads from onboarding store, not raw Privy `linkedAccounts`):

```typescript
import { useWalletAddresses } from '@/hooks/domain/use-wallet-addresses';

const { addresses, hasWallet, getAddress } = useWalletAddresses();
const suiAddress = getAddress('sui');
const solAddress = getAddress('solana');
```

### Privy Gotchas & Mistakes to Avoid

#### 1. NEVER use the `Hash` variant of `rawSign` for Sui

```typescript
// BAD — Hash variant produces invalid signatures for Sui transactions
const signResult = await privy.wallets().rawSign(walletId, {
  params: { hash: `0x${hashHex}` },
  ...
});

// GOOD — Bytes variant with blake2b256 (matches Sui's signing flow)
const signResult = await privy.wallets().rawSign(walletId, {
  params: {
    bytes: Buffer.from(intentMessage).toString('base64'),
    encoding: 'base64',
    hash_function: 'blake2b256',
  },
  ...
});
```

#### 2. ALWAYS strip `0x` from `rawSign` hex signatures

```typescript
// BAD — Buffer.from silently corrupts bytes when 0x prefix is present
const sig = Buffer.from(signResult.signature, 'hex');

// GOOD — strip the prefix first
const sig = Buffer.from(signResult.signature.replace(/^0x/, ''), 'hex');
```

#### 3. NEVER use `privy.users().get(userId)` — use `._get(userId)`

```typescript
// BAD — PrivyUsersService.get() only accepts { id_token }, not a string
const user = await privy.users().get(userId);

// GOOD — _get() from base Users class accepts a string user ID
const user = await privy.users()._get(userId);
```

#### 4. Privy public keys for Sui wallets are hex with a flag byte

```typescript
// Privy returns: "0063c7e614..." (hex: 00 flag + 32-byte key = 33 bytes)
// You must detect hex vs base64, then extract the last 32 bytes:
const isHex = /^(0x)?[0-9a-fA-F]+$/.test(rawString) && rawString.length >= 64;
const decoded = isHex
  ? Buffer.from(rawString.replace(/^0x/, ''), 'hex')
  : Buffer.from(rawString, 'base64');
const keyBytes = decoded.length > 32
  ? decoded.subarray(decoded.length - 32)
  : decoded;
```

#### 5. NEVER use `rawSign` for Solana wallets — use `signMessage`

```typescript
// BAD — rawSign rejects Solana wallets ("not supported for this endpoint")
await privy.wallets().rawSign(solanaWalletId, { ... });

// GOOD — use chain-specific signMessage
await privy.wallets().solana().signMessage(solanaWalletId, { ... });
```

#### 6. Pass `Uint8Array` to `signMessage` when possible

```typescript
// OK — base64 string (Privy assumes base64 for strings)
signMessage(walletId, { message: base64String });

// BETTER — Uint8Array (Privy handles encoding internally)
signMessage(walletId, { message: messageBytes });
```

#### 7. Verify cross-chain signatures locally before submitting on-chain

```typescript
import { ed25519 } from '@noble/curves/ed25519';

// Verify Solana signature matches message + pubkey before paying gas
const valid = ed25519.verify(signature, message, publicKey);
if (!valid) throw new Error('Signature verification failed locally');
```

#### 8. `useWalletAddresses` reads from onboarding store, NOT Privy `linkedAccounts`

Developer-owned wallets don't appear in `user.linkedAccounts`. The hook reads from the Zustand onboarding store which is populated from `custom_metadata` during the registration check.

---

## Anti-Patterns to Avoid

- **Never hard-code hex colors** → use Tailwind theme classes (`bg-accent`) or CSS variables (`var(--color-*)`)
- **Never destructure Zustand without selector** → use `useShallow` (see State Management above)
- **Never parse Privy addresses from `linkedAccounts`** → use `useWalletAddresses()` hook (dev-owned wallets aren't in `linkedAccounts`)
- **Never use floating-point for token math** → use `BigInt` / `CurrencyAmount` / `parseUnits`
- **Never use `<img>`** → use `<Image>` from `next/image` (Biome `noImgElement` rule)
- **Never use `text-white` for theme-dependent text** → use `text-text` (exception: text on colored-background buttons like `bg-accent text-white`)
- **Never use `useMemo`/`useCallback`/`React.memo`** → React Compiler handles memoization automatically
- **Never use `useEffect` for derived state** → compute during render (`const fullName = \`${first} ${last}\``)
- **Never swallow errors silently** → use `extractErrorMessage(err, 'fallback')` + `toasting.error()`
- **Never use inline `rgba()`** → use CSS variable that switches per theme (`var(--color-overlay-bg)`)
- **Never use `<div onClick>`** → use `<button>` or add `role="button"` + `tabIndex={0}` + `handleKeyDown` from `@/utils/handle-key-down`
- **Never use `<label>` without associated input** → use `htmlFor`/`id` or `<span>` for decorative labels
- **Never mutate props/state during render** → use `.toSorted()` / `[...arr].sort()` instead of `.sort()`

---

## Design System

### Visual Language Overview

The UI follows a **glassmorphism-first** design language: gradient backgrounds + backdrop blur + inset highlights + subtle borders. The accent palette is a violet/cyan aurora (dark: `#a78bfa`/`#06b6d4`, light: `#7c3aed`/`#0891b2`). Dark mode is the default; light theme is a full override via `[data-theme="light"]` in `globals.css`.

### Theme Architecture

Light + dark themes with system preference as default. Powered by `next-themes`:

- **Theme provider**: `components/providers/theme-provider/index.tsx`
- **Storage key**: `lattice-theme` (localStorage)
- **HTML attribute**: `data-theme="light" | "dark"`
- **Settings UI**: Theme selector in Settings menu (System / Dark / Light)

### Token Naming Convention

All design tokens follow `--color-{category}-{variant}` for simple colors and `--{component}-{property}` for complex values (gradients, shadows). Simple tokens (in `@theme`) generate Tailwind utilities like `bg-accent`, `text-text-muted`. Complex tokens (in `@layer base :root`) are used as `var(--token-name)` in inline styles. See `app/globals.css` for the full token list.

### Color Token Reference

**Accent** (6 variants) — primary interactive color:

| Token | Tailwind class | Purpose |
|-------|---------------|---------|
| `--color-accent` | `bg-accent`, `text-accent` | Primary accent (violet-400 / violet-600) |
| `--color-accent-hover` | `bg-accent-hover` | Hover state |
| `--color-accent-muted` | `text-accent-muted` | 50% opacity accent for secondary text |
| `--color-accent-subtle` | `bg-accent-subtle` | 20% opacity for light fills |
| `--color-accent-wash` | `bg-accent-wash` | 8% opacity for wash backgrounds |
| `--color-accent-border` | `border-accent-border` | 30% opacity for borders |

**Secondary accent** (cyan spark): `accent-secondary`, `accent-secondary-muted`

**Surface hierarchy** (4 layers, darkest → lightest):

| Token | Tailwind class | Purpose |
|-------|---------------|---------|
| `--color-surface` | `bg-surface` | Page background (`#080b14` dark / `#f0f4f8` light) |
| `--color-surface-raised` | `bg-surface-raised` | Elevated cards (`#0f1629` / `#ffffff`) |
| `--color-surface-overlay` | `bg-surface-overlay` | Overlay panels (`#161e35` / `#f7f8fb`) |
| `--color-surface-inset` | `bg-surface-inset` | Inset/sunken areas (`#060912` / `#e8edf4`) |

**Surface modifiers** (white-alpha in dark, purple-alpha in light):
`surface-light`, `surface-lighter`, `surface-hover`, `surface-border`, `surface-border-hover`

**Text scale** (5 levels):

| Token | Tailwind class | Purpose |
|-------|---------------|---------|
| `--color-text` | `text-text` | Primary text |
| `--color-text-secondary` | `text-text-secondary` | Secondary labels |
| `--color-text-muted` | `text-text-muted` | Muted/placeholder text |
| `--color-text-dimmed` | `text-text-dimmed` | Very dim text |
| `--color-text-dim` | `text-text-dim` | Near-invisible (dividers) |

**Status**: `success` (green), `error` (red), `warning` (amber) — semantic only

### Glassmorphism Patterns

There are 4 glass surface tiers. Each uses CSS variable tokens consumed via the `style` prop (not className):

**1. Card glass** — generic elevated containers:

```typescript
style={{
  background: 'var(--card-bg)',       // gradient with violet tint
  boxShadow: 'var(--card-shadow)',    // inset highlight + drop shadow
  backdropFilter: 'var(--card-backdrop)', // blur(24px) saturate(1.5)
}}
className="border border-surface-border rounded-3xl"
```

**2. Swap card glass** — heavier gradient with cyan hints (swap/bridge forms):

```typescript
const CARD_STYLE = {
  background: 'var(--swap-card-bg)',
  boxShadow: 'var(--swap-card-shadow)',
  border: '1px solid var(--swap-card-border)',
  backdropFilter: 'blur(24px) saturate(1.5)',
} as const;
```

**3. Modal glass** — heaviest blur, used for dialogs:

```typescript
style={{
  backdropFilter: 'blur(var(--blur-xl)) saturate(1.5)', // 50px blur
  background: 'var(--modal-bg)',
  boxShadow: 'var(--modal-shadow)',
}}
className="border border-modal-border rounded-[1.25rem]"
```

**4. Header/footer glass** — transparent background with blur:

```typescript
style={{
  background: 'var(--color-header-bg)',  // rgba with 60% opacity
  backdropFilter: 'blur(var(--blur-lg)) saturate(1.4)', // 24px blur
}}
```

### Blur Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--blur-sm` | `8px` | Light overlays |
| `--blur-md` | `12px` | Buttons, small elements (flip button) |
| `--blur-lg` | `24px` | Header, footer, cards |
| `--blur-xl` | `50px` | Modals, side panels |

Always use `var(--blur-*)` — never hardcode blur values.

### Glow & Shadow System

All glow/shadow values are CSS variables that switch per theme. Use them via `style` prop:

**Primary CTA button:**
- Background: `var(--btn-primary-bg)` (violet → cyan gradient)
- Idle shadow: `var(--cta-idle-glow)` + `.cta-ready-pulse` class for breathing animation
- Hover shadow: `var(--cta-hover-glow)` (intensified with lift)

**Flip button:** `var(--flip-btn-shadow)` → hover: `var(--flip-btn-hover-shadow)`

**Input focus:** `.input-focus-glow` utility class (applied on `:focus-within`)

**Toggle active:** `var(--toggle-track-active-bg)` gradient + `var(--toggle-track-active-shadow)` outer glow

**Toast status glows:** `var(--toast-success-glow)`, `var(--toast-error-glow)` — large ambient glow behind toast icons

### Animation & Motion Patterns

All positional/scale animations use Framer Motion springs (from `motion/react`), not CSS transitions. CSS `transition` is only used for color/opacity changes.

**Spring configs** — define as `const` outside the component:

| Category | Config | Used for |
|----------|--------|----------|
| Snappy | `{ type: 'spring', stiffness: 500, damping: 30, mass: 0.8 }` | Toggle thumb, tab indicator |
| Controlled | `{ type: 'spring', stiffness: 400, damping: 25 }` | Button hover/tap, token pill |
| Flip | `{ type: 'spring', stiffness: 400, damping: 22 }` | Flip button rotation |
| Card entry | `{ type: 'spring', stiffness: 300, damping: 30, delay: 0.05 }` | Swap/bridge card entrance |
| Panel slide | `{ type: 'spring', stiffness: 400, damping: 32, mass: 0.8 }` | Side panel |
| Modal pop | `{ type: 'spring', stiffness: 500, damping: 35 }` | Modal entrance |
| Cog | `{ type: 'spring', stiffness: 300, damping: 20 }` | Settings gear icon |

**Micro-interactions:**

```typescript
// Token pills, small interactive elements
whileHover={{ scale: 1.03 }}
whileTap={{ scale: 0.97 }}

// CTA buttons — lift + glow
whileHover={isDisabled ? undefined : { y: -3, scale: 1.01, boxShadow: 'var(--cta-hover-glow)' }}
whileTap={isDisabled ? undefined : { scale: 0.98 }}

// Wallet/secondary buttons — subtle lift
whileHover={{ y: -2, boxShadow: 'var(--btn-primary-hover-shadow)' }}
whileTap={{ scale: 0.98 }}

// Flip button — rotation + scale
whileHover={{ rotate: 180, scale: 1.1, boxShadow: 'var(--flip-btn-hover-shadow)' }}
whileTap={{ scale: 0.95 }}
```

**Entrance animations** — cards and modals:

```typescript
// Card entrance (swap form, bridge)
initial={{ opacity: 0, y: 12, scale: 0.98 }}
animate={{ opacity: 1, y: 0, scale: 1 }}

// Modal entrance
animate={{ y: ['2rem', '0rem'], opacity: [0, 1], scale: [0.96, 1] }}
```

**Reduced motion** — always check and provide fallback:

```typescript
import { useReducedMotion } from 'motion/react';

const reducedMotion = useReducedMotion();

// Use in transition/animate props:
transition={reducedMotion ? { duration: 0 } : SPRING_TRANSITION}
whileTap={reducedMotion ? undefined : { scale: 1.15 }}
```

**Mount guard** — prevent animation on first render for toggles/tabs:

```typescript
<motion.span initial={false} animate={{ x: active ? '1.3rem' : '0.25rem' }} />
// Also on AnimatePresence for detail panels:
<AnimatePresence initial={false}>
```

### Typography

| Usage | Class | Font |
|-------|-------|------|
| UI text | `font-sans` | "DM Sans" |
| Code/addresses | `font-mono` | "JetBrains Mono" |

### Spacing & Border Radius

**Border radius scale:**

| Class | Pixels | Usage |
|-------|--------|-------|
| `rounded-lg` | 8px | Close buttons, small UI elements |
| `rounded-xl` | 12px | Flip button, input fields |
| `rounded-2xl` | 16px | CTA buttons, inner cards |
| `rounded-3xl` | 24px | Main swap/bridge cards |
| `rounded-[1.25rem]` | 20px | Modals |
| `rounded-full` | 50% | Toggles, pills |

**Common padding:**

| Pattern | Usage |
|---------|-------|
| `p-3` (12px) | Small elements |
| `p-4` / `p-5` (16/20px) | Card content sections, modals |
| `p-6` (24px) | Large panels |
| `py-[18px] px-6` | CTA buttons |
| `px-5 pb-4` / `px-5 pt-4` | Swap card top/bottom sections (tighter gap around flip button) |

**Responsive container:**

```typescript
className="w-full sm:w-[30rem] px-2 sm:px-8"  // Swap view
className="w-full sm:w-[34rem] px-2 sm:px-8"  // Account view
```

### Component Styling Recipes

**Glass card** (for new elevated containers):

```typescript
<motion.div
  className="rounded-3xl border border-surface-border"
  style={{
    background: 'var(--card-bg)',
    boxShadow: 'var(--card-shadow)',
    backdropFilter: 'var(--card-backdrop)',
  }}
  initial={{ opacity: 0, y: 12, scale: 0.98 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
>
```

**Primary CTA button:**

```typescript
<motion.button
  className="w-full py-[18px] px-6 text-white text-base font-semibold rounded-2xl border-none focus-ring cta-ready-pulse"
  style={{
    background: 'var(--btn-primary-bg)',
    boxShadow: 'var(--cta-idle-glow)',
  }}
  whileHover={{ y: -3, scale: 1.01, boxShadow: 'var(--cta-hover-glow)' }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
>
```

**Interactive token pill:**

```typescript
<motion.button
  className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 cursor-pointer border-none"
  style={{
    background: 'var(--token-pill-bg)',
    border: '1px solid var(--token-pill-border)',
    boxShadow: 'var(--token-pill-shadow)',
  }}
  whileHover={{ scale: 1.03 }}
  whileTap={{ scale: 0.97 }}
  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
>
```

### Rules

1. **Never use hardcoded hex colors** in components — always use CSS variables or Tailwind theme classes
2. **Use `text-text`** for theme-dependent text, not `text-white` (exception: text on colored-background buttons like `bg-accent text-white`)
3. **Status colors** (`success`, `error`, `warning`) are semantic — only use them for their intended purpose
4. **Component tokens** (`toast-bg`, `modal-bg`, etc.) are scoped — only use them in their intended component
5. **Chain brand colors** in `constants/chains/` are intentionally theme-independent (they represent external brands)
6. **All interactive elements** must use Framer Motion springs for positional/scale animations — not CSS transitions (CSS `transition` is only for color/opacity)
7. **Always provide `useReducedMotion()` fallback** — check the hook and pass `{ duration: 0 }` or `undefined` for motion props
8. **Use CSS variable tokens** for shadows/glows — never inline `rgba()` for box-shadow values that should switch per theme
9. **Use the blur scale** (`var(--blur-sm/md/lg/xl)`) — never hardcode blur pixel values
10. **Glass surfaces** must use `backdrop-filter: blur() saturate()` — never just opacity for frosted glass effects
11. **Define spring configs as `const` outside the component** — never inline object literals in `transition` props
12. **Use `initial={false}`** on toggles, tabs, and `AnimatePresence` for detail panels to prevent animation on mount

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

## Important Project Notes

1. **Package Manager**: pnpm (9.1.0, pinned)
2. **Node Version**: >=18.17
3. **Active Views**: `views/swap` (Swap + Bridge tabs) and `views/account` (Balances + Deposit + Withdraw)
4. **Commit Style**: Gitmoji convention via commitlint

---

**Last Updated**: 2026-02-11
**Active Views**: `views/swap` and `views/account`
**Main Features**: Cross-chain SUI/SOL token swapping
