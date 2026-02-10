# Project Memory - Lattice UI

## Identity

- **Package**: `lattice-ui` v1.1.0
- **Purpose**: DeFi cross-chain swap application (SUI <-> SOL)
- **Framework**: Next.js 14 App Router + TypeScript strict mode
- **Deployed**: Vercel (Analytics integrated)

## Architecture Decisions

- **App Router** (not Pages Router) — `app/` directory with `layout.tsx`, `page.tsx`, route handlers
- **Stylin.js** for CSS-in-JS — prop-based styling on `Div`, `Span`, `Button`, `Input` from `@stylin.js/elements`
- **Zustand** for global state — selector pattern with `useShallow` required
- **SWR** for server state — balance/price data with 30-60s refresh intervals
- **React Hook Form** for forms — `useFormContext()` in sub-components
- **Privy** for wallet auth — dynamically imported with `ssr: false`
- **Biome** for linting/formatting (not ESLint/Prettier)
- **pnpm** as package manager (pinned to 9.1.0)
- **Husky + commitlint-config-gitmoji** for commit conventions

## Key Patterns to Follow

- **Component layers**: `providers/` > `layout/` > `composed/` > `ui/`
- **Hook layers**: `store/` > `blockchain/` > `domain/` > `ui/`
- **File naming**: `kebab-case/index.tsx` for components, `*.types.ts` for types
- **Imports**: Always use `@/` path alias (e.g., `@/hooks/store/use-app-state`)
- **Colors**: Use `ACCENT`, `ACCENT_HOVER`, `ACCENT_80`, `ACCENT_4D` from `@/constants/colors`
- **Entities**: Use `Token`, `CurrencyAmount`, `FixedPointMath` from `@/lib/entities` for token math
- **Chain config**: Use `CHAIN_REGISTRY` from `@/constants/chains` for chain-specific values
- **API routes**: All in `app/api/`, validate with Zod, proxy to backend services
- **Toast notifications**: Use `toasting.success/error/loading` factory from `@/components/ui/toast`
- **Dynamic imports**: Wallet/web3 components must use `dynamic(() => ..., { ssr: false })`

## Gotchas

- `useNetwork()` always returns `Network.MAINNET` — it's static, not a real hook
- `useMetadata()` has a biome-ignore for array deps — uses string join as dependency key
- Bridge only supports `sol-to-wsol` direction currently — others show "coming soon"
- `SettingsMenuFastMode` component exists but is not rendered (dead code)
- Provider components (`AppStateProvider`, `WalletRegistrationProvider`, `BackgroundProvider`) return `null` — they are side-effect only
- `ref as never` cast in `wallet-profile/index.tsx` — known ref typing workaround
- Token metadata exists in both `constants/coins.ts` and `constants/bridged-tokens.ts`

## Common Workflows

```bash
pnpm dev          # Dev server on port 3000
pnpm build        # Production build
pnpm lint         # Biome check (not eslint)
pnpm lint:fix     # Biome auto-fix
pnpm format       # Biome format
```

## Active Views

- `/` — Swap view (`views/swap/`) with Swap and Bridge tabs
- `/account` — Account view (`views/account/`) with Balances, Deposit, Withdraw tabs

## Environment Variables

```
NEXT_PUBLIC_PRIVY_APP_ID    # Privy auth
NEXT_PUBLIC_ENCLAVE_URL     # Enclave service
NEXT_PUBLIC_SOLVER_API_URL  # Solver API
NEXT_PUBLIC_SUI_RPC_URL     # Sui RPC (optional, fallback to mainnet)
```
