# Frontend Code Audit Report

**Date:** 2026-02-16
**Audited by:** Claude Code (Opus 4.6)
**Scope:** Full codebase review — components, hooks, lib, views, API routes, utils, constants
**Last updated:** 2026-02-16

---

## Executive Summary

**170+ issues** identified across 6 areas. The codebase is architecturally solid — good use of App Router, Zustand, TanStack Query, and a clean component layering system. The issues below are what separate "good" from "Fortune 500 polish."

| Area | Files Reviewed | Issues Found |
|------|---------------|-------------|
| Components | ~40 | 40+ |
| Hooks | ~27 | 34 |
| Lib (core logic) | ~30 | 14 categories |
| Views | ~30 | 38 |
| API Routes | ~24 | 28 |
| Utils/Constants | ~20 | 16 |

---

## P0 — Critical (Fix Immediately)

### ~~1. Missing `bigint-utils` implementations~~ FIXED

**File:** `lib/bigint-utils.ts`

Tests import `bigintAbs`, `bigintDivDown`, and `toFixed` but these functions don't exist in the source. The test suite fails on import.

**Resolution:** Implemented `bigintAbs`, `bigintDivDown`, and `toFixed` in `lib/bigint-utils.ts`. Also implemented missing `utils/bn.ts` functions (`feesCalcUp`, `isBigNumberish`, `isHexString`, `parseBigNumberish`, `parseToPositiveStringNumber`). All 61 tests now pass (34 in bigint-utils, 27 in bn).

---

### 2. Race condition in onboarding store

**File:** `hooks/store/use-onboarding/index.ts` (lines 102-108)

`doCheckRegistration` checks `_isProcessing` but doesn't prevent duplicate concurrent calls in the same tick. Two calls can both pass the guard before either sets `_isProcessing = true`.

**Status:** Partially mitigated — `_isProcessing` is now set synchronously before the first `await` (line 108), but a true mutex would be safer.

**Fix:** Use a synchronous lock pattern — set `_isProcessing` before the first `await`, or use a promise-based mutex.

---

### ~~3. Race condition in IKA client initialization~~ FIXED

**File:** `hooks/domain/use-bridge/index.ts`

Two refs manage initialization state (`ikaClientRef` and `ikaClientInitPromiseRef`). If `suiClient` changes during init, parallel initializations race. If init fails, `ikaClientRef` isn't reset but `ikaClientInitPromiseRef` is — creating inconsistent state on retry.

**Resolution:** Consolidated two refs (`ikaClientRef` + `ikaClientInitPromiseRef`) into a single `ikaClientStateRef` with `{ suiClient, client, promise }`. Now detects `suiClient` changes via identity comparison and resets the entire state, ensuring reinitialization with the new client. On failure, both `client` and `promise` are reset atomically so retries start clean.

---

### ~~4. Memory leak in RPC client caches~~ FIXED

**Files:**
- `hooks/blockchain/use-sui-client/index.ts`
- `hooks/blockchain/use-solana-connection/index.ts`

Module-level `Map` caches grow unbounded. Old clients are never evicted or destroyed.

**Resolution:** Replaced `Map` caches with single-slot caches. Sui client uses a `{ url, client }` tuple that replaces the old entry when the RPC URL changes. Solana client uses a simple singleton (only one URL possible).

---

### ~~5. Missing binary array size validation in Zod schemas~~ FIXED

**Files:**
- `app/api/xswap/create-request/route.ts`
- `app/api/xbridge/bridge-mint/route.ts`
- `app/api/xbridge/bridge-burn/create/route.ts`

**Resolution:** Added byte range constraints (`.int().min(0).max(255)`) and size limits (`.length(32)`, `.max(64)`, `.max(128)`) to all binary array schemas across all three files.

---

### ~~6. Missing input validation on API params~~ FIXED

**Files:**
- `app/api/wallet/send-solana/route.ts` — `mint` now has base58 regex validation
- `app/api/xbridge/bridge-burn/create/route.ts` — `nonceAddress` now has base58 regex validation
- `app/api/wallet/send-sui/route.ts` — `coinType` now has Sui coin type regex validation (`0x...::...::...`)

**Resolution:** Added `.regex()` validators matching expected formats on all three fields.

---

### ~~7. `Fraction.invert()` allows zero denominator~~ FIXED

**File:** `lib/entities/fraction.ts` (line 36)

**Resolution:** Added `invariant(this.numerator !== 0n, 'Cannot invert a zero fraction')` guard before creating the inverted fraction.

---

## P1 — High (DRY / Architecture / Reliability)

### ~~8. Duplicate spring animation configs (6 files)~~ FIXED

**Resolution:** Created `constants/animations.ts` with shared spring configs (`SPRING_SNAPPY`, `SPRING_CONTROLLED`, `SPRING_FLIP`, `SPRING_TABS`, `SPRING_PANEL_SLIDE`, `SPRING_MODAL_POP`, `SPRING_COG`) plus `INSTANT_TRANSITION`, overlay animation constants, and reduced-motion fallbacks. All 6 component files and 2 provider files now import from the shared module.

---

### ~~9. Duplicate number input filtering (2 files)~~ FIXED

**Resolution:** Extracted `filterDecimalInput` to `utils/decimal-input.ts`. Both `withdraw-view.tsx` and `send-modal.tsx` now import from the shared module.

---

### ~~10. Duplicate balance calculation logic (2 files)~~ FIXED

**Files:**
- `views/account/components/withdraw-view.tsx` (lines 37-42)
- `views/account/components/send-modal.tsx` (lines 31-36)

Nearly identical `getBalance()` functions checking `network === 'sui'` and returning from balance objects.

**Resolution:** Extracted `useChainBalance` hook to `hooks/domain/use-chain-balance/index.ts`. Both `withdraw-view.tsx` and `send-modal.tsx` now import `getBalanceByIndex`, `isLoading`, `formatBalance`, and `toHumanAmount` from the shared hook.

---

### ~~11. Duplicate explorer URL construction (2 files)~~ FIXED

**Files:**
- `views/swap/components/swap/swap-form/swap-success-modal.tsx` (lines 34-56)
- `views/swap/components/bridge/bridge-success-modal.tsx` (lines 40-51)

Near-identical source/destination URL logic based on chain type.

**Resolution:** Created unified `useGetChainExplorerUrl` hook in `hooks/domain/use-get-chain-explorer-url/index.ts`. Both success modals now call `getExplorerUrl(digest, chainKey)` instead of switching between Sui/Solana hooks.

---

### 12. Duplicate explorer constants (106 lines)

**Files:**
- `constants/explorer.ts` (52 lines)
- `constants/solana-explorer.ts` (54 lines)

Follow identical structural patterns with different data.

**Fix:** Create a generic `ExplorerConfig` interface and consolidate into one parameterized module.

---

### ~~13. Duplicate retry loop pattern (2 API routes)~~ FIXED (prior)

**Files:**
- `app/api/wallet/create-nonce/route.ts`
- `app/api/wallet/send-solana/route.ts`

**Resolution:** Extracted shared constants to `lib/solana/blockhash-retry.ts` (`BLOCKHASH_RETRY_ATTEMPTS`, `BLOCKHASH_RETRY_DELAY_MS`, `isRetryableSendError`). Both routes now import from the shared module.

---

### ~~14. Duplicate health check pattern (3 routes)~~ FIXED

**Resolution:** Extracted `checkHealth` to `lib/api/health-check.ts` with configurable timeout and body validation. All 3 health routes now import from the shared module.

---

### ~~15. Duplicate Solver error handling~~ FIXED

**Resolution:** Extracted `handleSolverError` private function in `lib/solver/server.ts`. Both `solverGet` and `solverPost` now delegate to it.

---

### ~~16. Duplicate `bigintString` Zod schema (3+ routes)~~ FIXED

**Resolution:** Exported `bigintString` and `byteArray` from `lib/api/zod-schemas.ts`. Updated `xswap/create-request`, `xbridge/bridge-mint`, and `xbridge/bridge-burn/create` routes to import from the shared module.

---

### ~~17. Duplicate gas balance display logic~~ FIXED

**Files:**
- `components/composed/header/gas-balances/index.tsx` (lines 19-26)
- `components/composed/wallet-button/wallet-profile/gas-balances-inline.tsx` (lines 17-25)

Identical balance computation and display logic.

**Resolution:** Extracted `useGasDisplay` hook to `hooks/domain/use-gas-display/index.ts`. Both `gas-balances/index.tsx` and `gas-balances-inline.tsx` now import from the shared hook.

---

### ~~18. Duplicate `ValidationResult` interface~~ FIXED

**Resolution:** Centralized `ValidationResult` in `interface/index.ts`. Both `utils/gas-validation.ts` and `bridge.types.ts` now import from the shared location.

---

### ~~19. Duplicate modal/panel overlay constants~~ FIXED

**Resolution:** Extracted `OVERLAY_ANIMATE`, `OVERLAY_EXIT`, `OVERLAY_TRANSITION`, `REDUCED_CONTAINER_ANIMATE`, `REDUCED_CONTAINER_TRANSITION`, `SPRING_MODAL_POP`, and `SPRING_PANEL_SLIDE` to `constants/animations.ts`. Both modal-provider and side-panel-provider now import from the shared module.

---

### ~~20. Refs that never reset (bugs)~~ FIXED

| File | Line | Issue | Status |
|------|------|-------|--------|
| `hooks/domain/use-gas-guard/index.ts` | 113 | `dismissedRef` set to `true`, never reset. | **FIXED** (prior) — ref now resets when modal closes and on balance recovery |
| `hooks/domain/use-presign-guard/index.ts` | 9-13 | `calledRef` never resets on logout. | **FIXED** — added `prevUserIdRef` that detects user change and resets `calledRef` |

---

### ~~21. Duplicate exponential retry in onboarding~~ FIXED

**File:** `hooks/store/use-onboarding/index.ts` (lines 195-296)

Both `doRegisterWallets` and `doStartLinking` duplicate the retry pattern.

**Resolution:** Extracted `scheduleRetry(retryCount, fn)` helper within the module. Both `doRegisterWallets` and `doStartLinking` now call `scheduleRetry` instead of duplicating the retry scheduling logic.

---

## P2 — Medium (Type Safety / Error Handling / Consistency)

### 22. Widespread `as string` type assertions (8+ files)

Every `useWatch` call uses `as string` or `as bigint` instead of proper generic typing:
- `components/composed/input-field/index.tsx:23`
- `input-field-asset.tsx:30-34`
- `input-field-balance.tsx:15`
- `input-field-balances.tsx:13`
- `input-field-modal.tsx:20-23`
- `input-field-price.tsx:12-13`
- `views/swap/components/swap/swap-form/swap-form-button/index.tsx:33-36`

**Fix:** Type the form schema properly with React Hook Form generics so `useWatch` infers types automatically.

---

### 23. Inconsistent error handling across API routes

| Issue | Files |
|-------|-------|
| Some routes use route logger, others use `console.error` | `send-solana`, `presign/ensure` vs bridge routes |
| Zero logging | `wallet/link-solana/route.ts` |
| Silent error swallowing | All health check routes |
| Wrong status code (500 for client error) | `wallet/link-solana/route.ts:106` (should be 400) |

**Fix:** Standardize all routes on the route logger pattern. Return 400 for client validation errors.

---

### ~~24. Inconsistent disabled button opacity~~ FIXED

**Resolution:** Standardized all disabled button opacities to `0.5` across `account-content.tsx`, `swap-form-button/index.tsx`, `bridge/index.tsx`, and `send-modal.tsx`.

---

### ~~25. Inconsistent CTA button animations~~ FIXED

`SwapFormButton` uses spring animations + `cta-ready-pulse` class. `WithdrawView` button uses `transition-colors duration-200` with no spring or pulse. All primary CTAs should be consistent.

**Resolution:** Updated both `withdraw-view.tsx` and `send-modal.tsx` to use `motion.button` with `SPRING_CONTROLLED`, `whileHover` (y: -3, scale: 1.01, cta-hover-glow), `whileTap` (scale: 0.98), and `useReducedMotion` fallback. Also consolidated `HOVER_SPRING` in swap-form-button and `CTA_SPRING` in bridge to import `SPRING_CONTROLLED` from `constants/animations.ts`.

---

### ~~26. Missing signature verification before on-chain execution~~ FIXED

**File:** `lib/privy/signing.ts` (lines 46-90)

`signAndExecuteSuiTransaction` doesn't verify signatures locally before submitting.

**Resolution:** Added local signature verification using `Ed25519PublicKey.verify(intentMessage, signatureBytes)` before `executeTransactionBlock`. Throws with descriptive error on verification failure, preventing gas waste on invalid signatures.

---

### 27. Unsafe response casting in Solver/Enclave

| File | Line | Issue |
|------|------|-------|
| `lib/solver/server.ts` | 41-42 | `return json.data as T` without validating `data` key exists |
| `lib/enclave/server.ts` | 30, 45 | `return response.json() as Promise<T>` — incorrect cast |

**Fix:** Validate response shape before casting, or use Zod on responses.

---

### ~~28. `Percent.feeFrom` rounding edge case~~ FIXED

**Resolution:** Added guard `const afterFee = rawValue > feeRounded ? rawValue - feeRounded : 0n;` in `lib/entities/percent.ts`.

---

### ~~29. `invariant()` misuse in API routes (5+ locations)~~ FIXED

**Resolution:** Replaced all `invariant()` calls in `bridge-burn/create`, `bridge-burn/sign`, and `bridge-mint` routes with explicit `if` checks returning `NextResponse.json({ error }, { status: 400|500 })`. Removed `tiny-invariant` imports from all three files.

---

### 30. Stale onboarding cache logic

**File:** `hooks/store/use-onboarding/index.ts` (lines 110-145)

Cache says "linked" but addresses may be `undefined`. The cache fast-path doesn't guarantee address presence, causing incorrect fallthrough to retry logic.

**Status:** Partially improved — `readCachedUser()` helper validates cache entry shape, and fallback logic checks `cached?.suiAddress && cached?.solanaAddress` before trusting.

**Fix:** Validate cached addresses before trusting cache state.

---

### ~~31. Debug `console.log` spam in production code~~ FIXED

**File:** `hooks/domain/use-bridge/index.ts`

**Resolution:** Removed all 5 debug `console.log` statements from `bridgeWsolToSol` (Phase D and Phase E logs). Retained `console.error` for actual error handling and `console.warn` for non-critical warnings.

---

### ~~32. Hardcoded magic byte offsets~~ FIXED

**File:** `hooks/domain/use-bridge/index.ts`

**Resolution:** Extracted magic numbers into named constants:
```typescript
const NUM_SIGS = 2;
const SIG_SIZE = 64;
const NUM_SIGS_OFFSET = 0;
const SIG_1_OFFSET = 1;
const SIG_2_OFFSET = SIG_1_OFFSET + SIG_SIZE;
const MESSAGE_OFFSET = SIG_2_OFFSET + SIG_SIZE;
```

---

### 33. Inconsistent loading/error state exposure across hooks

| Hook | Exposes `isLoading` | Exposes `error` |
|------|--------------------|-----------------|
| `use-token-prices` | Yes | Yes |
| `use-solver-metadata` | Yes | No |
| `use-health` | Yes | No |
| `use-nonce-account` | Yes | Mutation only, not query |

**Fix:** Standardize all data hooks to expose `{ data, isLoading, error }`.

---

### ~~34. Missing `Cache-Control: no-store` on mutation endpoints~~ FIXED

**Resolution:** Added `headers: { 'Cache-Control': 'no-store' }` to success responses in `send-solana`, `send-sui`, and `create-nonce` routes.

---

### ~~35. Solana message builder has no input validation~~ FIXED

**Resolution:** Added validation checks in `buildNativeSolTransfer`: all address arrays must be 32 bytes, amount must be non-negative, and amount must fit in u64.

---

### 36. Duplicate state sources in `use-nonce-account`

**File:** `hooks/domain/use-nonce-account/index.ts` (lines 58-64)

Manually syncs both Zustand state and TanStack Query cache. If these drift, there's no single source of truth.

**Fix:** Use TanStack Query as the sole source of truth and derive Zustand state from it, or vice versa.

---

### 37. Module-level mutable state in onboarding

**File:** `hooks/store/use-onboarding/index.ts` (lines 93-100)

Global `retryTimer` variable outside Zustand creates potential memory leaks if cleanup doesn't happen properly.

**Fix:** Store timer ID in Zustand state instead of a module-level variable.

---

### 38. `use-swap` ref pattern abuse

**File:** `hooks/domain/use-swap/index.ts` (lines 79-82)

Using `useRef` to cache `getPrice` and `slippageBps`, updated every render, used inside a callback. This creates stale closure risks.

**Status:** Acceptable pattern with React Compiler — refs are immediately updated and used in callbacks to avoid dependency array issues.

---

### 39. Partial wallet creation failure not handled

**File:** `hooks/store/use-onboarding/index.ts` (lines 206-231)

`Promise.all` creates Sui + Solana wallets in parallel. If one succeeds and the other fails, the successful wallet is orphaned with no cleanup.

**Fix:** Handle partial success by storing whichever wallet was created, and only retry the failed one.

---

### 40. `CurrencyAmount.multiply` has no overflow check

**File:** `lib/entities/currency-amount.ts` (lines 66-69)

Multiplication by large factors can create unreasonably large amounts silently.

**Fix:** Add a sanity check or document that callers must validate.

---

## P3 — Low (Polish / Cleanup / Accessibility)

### ~~41. Unused `ZERO_BIG_INT` export~~ RESOLVED

**File:** `utils/bn.ts` — `ZERO_BIG_INT` is now part of a fully populated module with `feesCalcUp`, `isBigNumberish`, etc. No longer a dead export.

---

### ~~42. Misplaced `REQUEST_DEADLINE_MS`~~ FIXED

**File:** `constants/coins.ts` (line 9) — This timeout constant has nothing to do with coin metadata.

**Resolution:** Moved `REQUEST_DEADLINE_MS` to `constants/timeouts.ts`. Updated `hooks/domain/use-swap/index.ts` to import from the new location. Added `timeouts` to `constants/index.ts` barrel export.

---

### 43. Unnecessary `Suspense` wrapper

**File:** `app/page.tsx` (lines 5-8) — Wraps in `<Suspense>` without a `fallback` prop and no `use()` hooks inside.

---

### 44. Missing exports in `constants/index.ts`

Doesn't export `z-index`, `refetch-intervals`, `toast`, or `slippage` submodules.

---

### 45. Missing provider exports in `components/providers/index.ts`

Doesn't export `GasGuardProvider`, `PresignGuardProvider`, `SidePanelProvider`, `AuthInitializer`, or `ThemeProvider`.

---

### ~~46. `Trade.rate` getter has confusing dead math~~ FIXED

**File:** `lib/entities/trade.ts` (line 84-88)

**Resolution:** Removed the redundant `PRICE_SCALE` multiplication from both numerator and denominator. Now simply `Number(numerator) / Number(denominator)`.

---

### ~~47. Decorative `<hr>` elements missing `aria-hidden="true"`~~ FIXED

**Resolution:** Added `aria-hidden="true"` to all decorative `<hr>` elements in `components/composed/panel-content/index.tsx`.

---

### ~~48. SVG spinners missing `aria-hidden="true"`~~ FIXED (already)

**File:** `components/ui/toast/toast-loading.tsx` (line 32)

**Resolution:** Already has `aria-hidden="true"` on the spinner SVG (line 32). `components/ui/spinner/index.tsx` uses `role="status"` with `aria-label="Loading"` — both properly accessible.

---

### 49. Inconsistent null checking patterns

Mix of `!= null`, optional chaining `?.`, and truthiness checks across components. Pick one convention and standardize.

---

### 50. Redundant `ALPHA_LIMITS` in gas-validation

**File:** `utils/gas-validation.ts` (lines 11-14) — Duplicates data already in `CHAIN_REGISTRY`.

---

### 51. `use-theme-colors` reads CSS vars synchronously every render

**File:** `hooks/ui/use-theme-colors/index.ts` (lines 3-6)

`getComputedStyle` on every render causes layout thrashing.

**Fix:** Cache values and update on theme change only.

---

### ~~52. `use-safe-height` double event listeners~~ FIXED (prior)

**File:** `hooks/ui/use-safe-height/index.ts`

**Resolution:** Now uses `window.visualViewport?.addEventListener` which gracefully handles null, preventing double registration on desktop.

---

### 53. Inconsistent explorer enum naming

- Sui: `ExplorerMode`
- Solana: `SolanaExplorerMode`

Should be consistent: either both prefixed or neither.

---

### 54. Defensive nullish-coalescing on static data

**File:** `constants/chains/chain-tokens.ts` (lines 28-30, 35-37)

```typescript
name: ASSET_METADATA[SUI_TYPE_ARG]?.name ?? 'Sui',
```

If `ASSET_METADATA` is properly initialized (it is), these fallbacks mask programming errors instead of surfacing them.

---

### ~~55. `use-login-identity` silently swallows wallet errors~~ FIXED

**File:** `hooks/domain/use-login-identity/index.ts` (lines 19-21)

**Resolution:** Added `console.warn('[login-identity] Failed to resolve wallet icon:', err)` to the catch block so failures are no longer silent.

---

### 56. Error boundary TODO never implemented

**File:** `components/providers/error-boundary/index.tsx` (line 24-26)

The `componentDidCatch` only logs to console. No error reporting service integration.

---

### 57. Missing test coverage for critical paths

| Module | Status |
|--------|--------|
| `lib/xbridge/client.ts` (6 public functions) | No tests |
| `lib/solver/server.ts` (6 public functions) | Needs verification |
| `lib/privy/signing.ts` | No tests |
| `lib/chain-adapters/` | No tests |

---

## Fix Summary

| Item | Description | Status |
|------|-------------|--------|
| **#1** | Missing `bigint-utils` + `bn.ts` implementations | **FIXED** |
| **#2** | Race condition in onboarding store | Partially mitigated |
| **#3** | Race condition in IKA client init | **FIXED** |
| **#4** | Memory leak in RPC caches | **FIXED** |
| **#5** | Missing Zod array size validation | **FIXED** |
| **#6** | Missing API param validation | **FIXED** |
| **#7** | `Fraction.invert()` zero denominator | **FIXED** |
| **#8** | Duplicate spring animation configs | **FIXED** |
| **#9** | Duplicate number input filtering | **FIXED** |
| **#13** | Duplicate retry loop pattern | **FIXED** (prior) |
| **#14** | Duplicate health check pattern | **FIXED** |
| **#15** | Duplicate Solver error handling | **FIXED** |
| **#16** | Duplicate bigintString Zod schema | **FIXED** |
| **#18** | Duplicate ValidationResult interface | **FIXED** |
| **#19** | Duplicate modal/panel overlay constants | **FIXED** |
| **#20** | Refs that never reset | **FIXED** |
| **#24** | Inconsistent disabled button opacity | **FIXED** |
| **#28** | Percent.feeFrom rounding edge case | **FIXED** |
| **#29** | invariant() misuse in API routes | **FIXED** |
| **#31** | Debug console.logs in use-bridge | **FIXED** |
| **#32** | Hardcoded magic byte offsets | **FIXED** |
| **#34** | Missing Cache-Control on mutations | **FIXED** |
| **#35** | Solana message builder validation | **FIXED** |
| **#38** | use-swap ref pattern | Acceptable (React Compiler) |
| **#41** | Unused ZERO_BIG_INT export | **RESOLVED** |
| **#42** | Misplaced REQUEST_DEADLINE_MS | **FIXED** |
| **#46** | Trade.rate dead math | **FIXED** |
| **#47** | Decorative hr missing aria-hidden | **FIXED** |
| **#48** | SVG spinner aria-hidden | **FIXED** (already) |
| **#52** | use-safe-height double listeners | **FIXED** (prior) |
| **#55** | Silent error swallowing in use-login-identity | **FIXED** |
| **#10** | Duplicate balance calculation logic | **FIXED** |
| **#11** | Duplicate explorer URL construction | **FIXED** |
| **#17** | Duplicate gas balance display logic | **FIXED** |
| **#21** | Duplicate exponential retry in onboarding | **FIXED** |
| **#25** | Inconsistent CTA button animations | **FIXED** |
| **#26** | Missing signature verification | **FIXED** |

**Total: 35 items fully fixed, 2 partially mitigated, 1 resolved as acceptable**

---

## Recommended Action Plan (Remaining)

| Priority | Action | Impact | Effort |
|----------|--------|--------|--------|
| ~~**P0**~~ | ~~All P0 items~~ | | **DONE** |
| ~~**P1**~~ | ~~Create `constants/animations.ts` (#8, #19)~~ | ~~DRY (8 files)~~ | **DONE** |
| ~~**P1**~~ | ~~Extract shared utils (#9, #14, #15, #16, #18)~~ | ~~DRY (10+ files)~~ | **DONE** |
| ~~**P1**~~ | ~~Extract shared balance calc hook (#10)~~ | ~~DRY (2 files)~~ | **DONE** |
| ~~**P1**~~ | ~~Consolidate explorer URL construction (#11)~~ | ~~DRY (4 files)~~ | **DONE** |
| **P1** | Consolidate explorer constants (#12) | DRY (106 lines) | Medium |
| ~~**P1**~~ | ~~Extract gas display hook (#17)~~ | ~~DRY (2 files)~~ | **DONE** |
| ~~**P1**~~ | ~~Extract retry helper (#21)~~ | ~~DRY~~ | **DONE** |
| **P1** | Type `useWatch` calls properly (#22) | Type safety (8 files) | Medium |
| **P2** | Standardize API route error handling + logging (#23) | Consistency | Medium |
| ~~**P2**~~ | ~~Add CTA spring animations to all primary buttons (#25)~~ | ~~Consistency~~ | **DONE** |
| ~~**P2**~~ | ~~Add signature verification before on-chain exec (#26)~~ | ~~Security~~ | **DONE** |
| **P2** | Validate Solver/Enclave response shapes (#27) | Safety | Small |
| **P2** | Standardize hook return shapes (#33) | DX | Medium |
| ~~**P3**~~ | ~~Clean up misplaced constants (#42)~~ | ~~Hygiene~~ | **DONE** |
| **P3** | Add test coverage for critical paths (#57) | Reliability | Large |

---

*Generated by Claude Code full codebase audit. Review periodically and check off items as they are resolved.*
