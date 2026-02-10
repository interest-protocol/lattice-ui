# Winter Walrus (Lattice UI) - Project Guide

## Project Overview

**Winter Walrus** is a DeFi application that provides cross-chain swap functionality between SUI and SOL tokens. Users can seamlessly exchange assets across the Sui and Solana blockchains.

- **Tech Stack**: Next.js, TypeScript, React, Framer Motion, Stylin.js
- **Blockchains**: Sui Network & Solana
- **Wallet**: Privy integration for wallet connection
- **Bridge**: Cross-chain swap via bridge protocol (Wormhole or similar)
- **Styling**: Stylin.js (CSS-in-JS with styled components)

## Project Structure

```
lattice-ui/
├── components/          # Reusable UI components
│   ├── app-state-provider/   # Global state management
│   ├── background/            # Animated backgrounds (blur, particles)
│   ├── header/                # App header with TVL, navbar
│   ├── input-field/           # Token input components with asset selection
│   ├── privy-provider/        # Privy wallet provider setup
│   ├── settings/              # Settings menu (validator, RPC, explorer)
│   ├── svg/                   # SVG icon components
│   ├── tabs/                  # Tab navigation component
│   └── wallet-button/         # Wallet connection UI
├── constants/           # App-wide constants
│   ├── colors.ts              # Color palette (ACCENT variants)
│   ├── index.ts               # Main constants export
│   ├── routes.ts              # Route definitions
│   └── storage-keys.ts        # LocalStorage keys
├── hooks/               # Custom React hooks
│   ├── use-blizzard-sdk/      # Blizzard SDK integration
│   ├── use-coins/             # Coin data fetching
│   ├── use-epoch-data/        # Staking epoch information
│   ├── use-fees/              # Transaction fee calculations
│   ├── use-interest-stable-sdk/  # Interest Protocol SDK
│   └── use-network/           # Network configuration
├── pages/               # Next.js pages (routing)
│   ├── _app.tsx               # App wrapper with providers
│   ├── index.tsx              # Home page → Stake view
│   └── [lst].tsx              # Dynamic LST page → Stake view
├── public/              # Static assets
└── views/               # Page-level view components
    └── stake/           # Main staking interface (ONLY active view)
        ├── components/
        │   ├── epoch/         # Epoch information display
        │   ├── stake/         # Stake tokens form
        │   ├── swap/          # Swap between token variants
        │   ├── transmute/     # Token transmutation
        │   └── unstake/       # Unstake tokens form
        └── stake-content.tsx  # Main stake view layout
```

## Key Architecture Patterns

### 1. Provider Architecture

The app uses a multi-layer provider structure in `pages/_app.tsx`:

```typescript
<PrivyProvider appId="cmla080ug00abk10dlfl0bplc">
  <AppStateProvider>
    <BackgroundProvider>
      <ModalProvider>
        <Layout>
          {/* Page content */}
        </Layout>
      </ModalProvider>
    </BackgroundProvider>
  </AppStateProvider>
</PrivyProvider>
```

**Important**: Privy App ID is `cmla080ug00abk10dlfl0bplc`

### 2. Component Naming Conventions

- **Components**: PascalCase (e.g., `WalletButton`, `InputField`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAppState`, `useCoins`)
- **Types**: PascalCase with `.types.ts` suffix (e.g., `wallet-profile.types.ts`)
- **SVG Components**: PascalCase with `SVG` suffix (e.g., `LogoSVG`, `SwapSVG`)

### 3. Styling with Stylin.js

Uses Stylin.js elements for CSS-in-JS:

```typescript
import { Div, Button, Span } from '@stylin.js/elements';

<Div
  p="1rem"
  bg="#FFFFFF0D"
  nHover={{ bg: '#FFFFFF1A' }}
>
  Content
</Div>
```

**Color Constants** (from `constants/colors.ts`):
- `ACCENT`: `#A78BFA` (primary purple)
- `ACCENT_HOVER`: `#C4B5FD` (hover state)
- `ACCENT_80`: `#A78BFA80` (80% opacity)
- `ACCENT_4D`: `#A78BFA4D` (4D opacity)

### 4. Form Components Pattern

Forms follow this structure:
- **Form Container**: Manages state and layout
- **Form Button**: Handles submission with preview modal
- **Form Preview**: Shows transaction preview before execution
- **Form Hooks**: Business logic in `use-{action}.ts` files

Example: `swap/swap-form/`

### 5. Modal System

Uses a central `ModalProvider` with `useModal()` hook:

```typescript
const { setContent } = useModal();

// Open modal
setContent(<YourModalComponent />, {
  title: 'Modal Title'
});
```

### 6. Bridge Integration

Cross-chain swapping requires:
- **Wormhole SDK** (or similar): Bridge protocol for SUI ↔ SOL transfers
- **Solana Web3.js**: Solana blockchain interactions
- **Sui SDK**: Already integrated via Privy

## Active Features

### Current Pages (2)
1. **`/`** (index) - Main swap interface
2. **`/[lst]`** - Dynamic page (also routes to swap)

Both route to `views/swap` - the ONLY active view.

### Swap View Components

The swap view provides:
- **SUI ↔ SOL Swap**: Cross-chain token exchange via bridge
- **Exchange Rate Display**: Real-time SUI/SOL rates
- **Fee Estimation**: Bridge and gas fees
- **Swap Direction Toggle**: Easy switching between SUI→SOL and SOL→SUI

### Settings Menu Features

Accessible via settings icon in header:
- **RPC Endpoint**: Configure custom RPC
- **Explorer**: Select block explorer (Suivision, SuiScan, etc.)
- **Fast Mode**: Toggle for faster transactions

All settings persist to localStorage using keys from `constants/storage-keys.ts`.

## Important Notes

### Navigation

The app has **NO navigation menu**. The `NAV_ITEMS` array in `constants/routes.ts` is **intentionally empty**:

```typescript
export const NAV_ITEMS: ReadonlyArray<RoutesEnum> = [];
```

Only external link: "Docs" → https://interest-protocol.gitbook.io/winter-walrus

### Wallet Connection

Uses **Privy** for wallet integration (NOT a custom modal):
- Import: `import { usePrivy } from '@privy-io/react-auth';`
- Methods: `login()`, `logout()`, `authenticated`, `user`

### Removed Features

These features were **recently removed** (do not recreate):
- ❌ Portfolio view (`views/portfolio/`)
- ❌ DeFi integrations view (`views/defi/`)
- ❌ Statistics view (`views/stats/`)
- ❌ **Staking features** (Stake, Unstake, Transmute, Epoch) - replaced with SUI/SOL swap

## Development Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Linting
npm run lint

# Type checking
npm run type-check  # (if available)
```

## Code Quality Tools

### ESLint Configuration
- **Unused imports**: `unused-imports/no-unused-imports` (error)
- **Unused vars**: `@typescript-eslint/no-unused-vars` (error)
- **Convention**: Variables starting with `_` are ignored (unused parameter convention)

### Git Hooks
- **Pre-commit**: Runs `lint-staged` via Husky
- **Commit lint**: Uses `@commitlint/config-conventional`

## Common Patterns

### 1. Reading Application State

```typescript
import { useAppState } from '@/hooks/use-app-state';

const { state, dispatch } = useAppState();
// Access: state.coins, state.network, etc.
```

### 2. Fetching Coin Data

```typescript
import { useCoins } from '@/hooks/use-coins';

const coins = useCoins();
// Returns array of coin metadata
```

### 3. Network Configuration

```typescript
import { useNetwork } from '@/hooks/use-network';

const network = useNetwork();
// Returns: { rpc, explorer, validator, etc. }
```

### 4. Input Field with Asset Selection

```typescript
import InputField from '@/components/input-field';

<InputField
  value={amount}
  onChange={setAmount}
  onSelectCoin={handleCoinSelect}
  selectedCoin={coin}
  balance={userBalance}
/>
```

### 5. Toast Notifications

```typescript
import { toast } from 'react-hot-toast';

toast.success('Transaction successful!');
toast.error('Transaction failed');
toast.loading('Processing...');
```

## File Naming Conventions

- **Components**: `kebab-case/index.tsx` (e.g., `wallet-button/index.tsx`)
- **Hooks**: `use-{name}/index.ts` (e.g., `use-coins/index.ts`)
- **Types**: `{component-name}.types.ts`
- **Utilities**: `{util-name}.ts`
- **Constants**: `{category}.ts` (e.g., `routes.ts`, `colors.ts`)

## Storage Keys

Defined in `constants/storage-keys.ts`:
- `EPOCH_COLLAPSE_STORAGE_KEY`: Epoch section collapse state
- `FAST_MODE_STORAGE_KEY`: Fast mode toggle
- `EXPLORER_STORAGE_KEY`: Selected block explorer
- `RPC_STORAGE_KEY`: Custom RPC endpoint
- `VALIDATOR_STORAGE_KEY`: Selected validator

## Animation

Uses **Framer Motion** (`motion/react`):

```typescript
import { motion } from 'motion/react';

const Motion = motion.create(Div);

<Motion
  animate={{ opacity: [0, 1] }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.3 }}
>
  Content
</Motion>
```

## SVG Icons

All SVG components are in `components/svg/` and exported from `components/svg/index.ts`.

**Usage**:
```typescript
import { LogoSVG, SwapSVG, WalletSVG } from '@/components/svg';
```

**Available icons** (27 total):
- Bars, Bluefin, Bucket, CaretDown, CaretUp
- Check, Checkbox, ChevronDown, ChevronRight
- Cog, Copy, Error, ExternalLink
- Grid, Info, Logo, Logout
- Noodles, PizzaPart (25/50/100%), Scallop
- Search, Swap, Wal, Wallet

## Dependencies

### Core
- `next`: Next.js framework
- `react`: React library
- `@mysten/sui`: Sui blockchain SDK
- `@privy-io/react-auth`: Wallet connection

### UI/Styling
- `@stylin.js/elements`: CSS-in-JS styling
- `motion`: Framer Motion animations
- `react-hot-toast`: Toast notifications

### Utilities
- `ramda`: Functional programming utilities
- `bignumber.js`: Precise number calculations
- `dayjs`: Date/time handling

### Development
- `typescript`: Type safety
- `eslint`: Linting
- `eslint-plugin-unused-imports`: Unused code detection
- `husky`: Git hooks
- `lint-staged`: Pre-commit linting

## Best Practices

### 1. Don't Create Unused Code
- The project was recently cleaned of ~4,000 lines of dead code
- Only create components/hooks when they're immediately needed
- Remove code when features are deprecated

### 2. Use Existing Hooks
Before creating new hooks, check if functionality exists:
- `useAppState` - Global state
- `useCoins` - Coin data
- `useNetwork` - Network config
- `useFees` - Fee calculations

### 3. Follow Styling Patterns
- Use Stylin.js elements (not raw CSS or styled-components)
- Use color constants from `constants/colors.ts`
- Follow responsive design patterns: `display={['mobile', 'tablet', 'desktop', 'wide']}`

### 4. Type Safety
- Define types in `.types.ts` files
- Export and import types explicitly
- Use TypeScript strict mode

### 5. Component Organization
```
component-name/
├── index.tsx                    # Main component
├── component-name.types.ts      # TypeScript types
├── component-name-{variant}/    # Sub-components
│   └── index.tsx
└── use-{feature}.ts            # Component-specific hooks
```

## Troubleshooting

### Build Errors
1. Check for unused imports: `npm run lint`
2. Verify all imports resolve correctly
3. Check TypeScript errors: `npx tsc --noEmit`

### Runtime Errors
1. Check Privy configuration (App ID must be correct)
2. Verify network RPC endpoint is accessible
3. Check browser console for SDK errors

### Styling Issues
1. Ensure Stylin.js elements are imported
2. Check responsive array syntax: `[mobile, tablet, desktop, wide]`
3. Verify color constants are imported from `constants/colors.ts`

## Links

- **Docs**: https://interest-protocol.gitbook.io/winter-walrus
- **Privy App ID**: `cmla080ug00abk10dlfl0bplc`

## Recent Changes (2026-02-06)

- ✅ **Major Feature Change**: Replaced entire staking system with SUI/SOL cross-chain swap
- ✅ Removed all staking features (Stake, Unstake, Transmute, Epoch)
- ✅ Renamed `views/stake/` → `views/swap/`
- ✅ Deleted staking-specific hooks (use-staking-objects, use-pending-rewards, use-lst-apr, etc.)
- ✅ Cleaned up AppState (removed stakingObjectIds, objectsActivation, principalsByType)
- ✅ Simplified constants (removed epoch, validator storage keys)
- ✅ Removed StakingObject interface and WAL token constants
- ✅ Current focus: Cross-chain SUI ↔ SOL swapping

---

**Last Updated**: 2026-02-06
**Active View**: `views/swap` only
**Main Features**: Cross-chain SUI/SOL token swapping
