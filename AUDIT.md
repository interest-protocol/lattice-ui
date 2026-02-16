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

### 3. Race condition in IKA client initialization

**File:** `hooks/domain/use-bridge/index.ts` (lines 93-112)

Two refs manage initialization state (`ikaClientRef` and `ikaClientInitPromiseRef`). If `suiClient` changes during init, parallel initializations race. If init fails, `ikaClientRef` isn't reset but `ikaClientInitPromiseRef` is — creating inconsistent state on retry.

**Fix:** Use a single ref with a state machine (`idle | initializing | ready | error`) or consolidate into Zustand.

---

### 4. Memory leak in RPC client caches

**Files:**
- `hooks/blockchain/use-sui-client/index.ts` (lines 6-16)
- `hooks/blockchain/use-solana-connection/index.ts` (lines 5-13)

Module-level `Map` caches grow unbounded. Old clients are never evicted or destroyed.

**Fix:** Use a single cached client (not a Map) or add an eviction policy.

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

### 8. Duplicate spring animation configs (6 files)

The same `{ type: 'spring', stiffness: 400-500, damping: 25-30 }` is independently defined in:

| File | Constant Name |
|------|--------------|
| `components/composed/flip-button/index.tsx` | `FLIP_BTN_SPRING` |
| `components/composed/input-field/input-field-asset.tsx` | `TOKEN_PILL_SPRING` |
| `components/composed/wallet-button/connect-wallet/index.tsx` | `HOVER_SPRING` |
| `components/composed/settings/index.tsx` | `COG_SPRING` |
| `components/ui/tabs/index.tsx` | `SPRING_TRANSITION` |
| `components/ui/toggle/index.tsx` | `SPRING_TRANSITION` |

**Fix:** Create `constants/animations.ts`:
```typescript
export const SPRING_SNAPPY = { type: 'spring', stiffness: 500, damping: 30, mass: 0.8 } as const;
export const SPRING_CONTROLLED = { type: 'spring', stiffness: 400, damping: 25 } as const;
export const SPRING_FLIP = { type: 'spring', stiffness: 400, damping: 22 } as const;
export const SPRING_CARD_ENTRY = { type: 'spring', stiffness: 300, damping: 30, delay: 0.05 } as const;
export const SPRING_PANEL_SLIDE = { type: 'spring', stiffness: 400, damping: 32, mass: 0.8 } as const;
export const SPRING_MODAL_POP = { type: 'spring', stiffness: 500, damping: 35 } as const;
export const SPRING_COG = { type: 'spring', stiffness: 300, damping: 20 } as const;
```

---

### 9. Duplicate number input filtering (2 files)

**Files:**
- `views/account/components/withdraw-view.tsx` (lines 206-216)
- `views/account/components/send-modal.tsx` (lines 204-215)

Identical decimal-only input regex logic.

**Fix:** Extract to `utils/decimal-input.ts`:
```typescript
export const filterDecimalInput = (value: string): string => {
  const filtered = value.replace(/[^0-9.]/g, '');
  const firstDot = filtered.indexOf('.');
  if (firstDot !== -1) {
    return filtered.slice(0, firstDot + 1) + filtered.slice(firstDot + 1).replace(/\./g, '');
  }
  return filtered;
};
```

---

### 10. Duplicate balance calculation logic (2 files)

**Files:**
- `views/account/components/withdraw-view.tsx` (lines 37-42)
- `views/account/components/send-modal.tsx` (lines 31-36)

Nearly identical `getBalance()` functions checking `network === 'sui'` and returning from balance objects.

**Fix:** Extract to a shared hook: `hooks/domain/use-chain-balance/index.ts`.

---

### 11. Duplicate explorer URL construction (2 files)

**Files:**
- `views/swap/components/swap/swap-form/swap-success-modal.tsx` (lines 34-56)
- `views/swap/components/bridge/bridge-success-modal.tsx` (lines 40-51)

Near-identical source/destination URL logic based on chain type.

**Status:** Partially addressed — swap-success-modal now uses `useGetExplorerUrl` hooks.

**Fix:** Extract to `utils/explorer-urls.ts`.

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

### 14. Duplicate health check pattern (3 routes)

**Files:**
- `app/api/health/route.ts`
- `app/api/health/enclave/route.ts`
- `app/api/health/solver/route.ts`

Identical fetch-with-timeout patterns.

**Fix:** Extract to `lib/api/health-check.ts`:
```typescript
export const checkHealth = async (url: string, timeout = 5_000): Promise<boolean> => { ... };
```

---

### 15. Duplicate Solver error handling

**File:** `lib/solver/server.ts` (lines 32-38 and 60-66)

`solverGet` and `solverPost` have byte-for-byte identical error handling blocks.

**Fix:** Extract to a private `handleSolverError` function.

---

### 16. Duplicate `bigintString` Zod schema (3+ routes)

Repeated in multiple API routes:
```typescript
const bigintString = z.string().regex(/^\d+$/, 'Must be a non-negative integer');
```

**Fix:** Export from `lib/api/zod-schemas.ts`.

---

### 17. Duplicate gas balance display logic

**Files:**
- `components/composed/header/gas-balances/index.tsx` (lines 19-26)
- `components/composed/wallet-button/wallet-profile/gas-balances-inline.tsx` (lines 17-25)

Identical balance computation and display logic.

**Fix:** Extract to a shared hook: `hooks/domain/use-gas-display/index.ts`.

---

### 18. Duplicate `ValidationResult` interface

**Files:**
- `utils/gas-validation.ts` (lines 6-9)
- `views/swap/components/bridge/bridge.types.ts` (lines 131-134)

**Fix:** Centralize in `interface/index.ts`.

---

### 19. Duplicate modal/panel overlay constants

**Files:**
- `components/providers/modal-provider/index.tsx` (lines 18-29)
- `components/providers/side-panel-provider/index.tsx` (lines 15-27)

Nearly identical `OVERLAY_ANIMATE`, `OVERLAY_TRANSITION` values.

**Fix:** Extract to `constants/animations.ts` alongside spring configs.

---

### ~~20. Refs that never reset (bugs)~~ FIXED

| File | Line | Issue | Status |
|------|------|-------|--------|
| `hooks/domain/use-gas-guard/index.ts` | 113 | `dismissedRef` set to `true`, never reset. | **FIXED** (prior) — ref now resets when modal closes and on balance recovery |
| `hooks/domain/use-presign-guard/index.ts` | 9-13 | `calledRef` never resets on logout. | **FIXED** — added `prevUserIdRef` that detects user change and resets `calledRef` |

---

### 21. Duplicate exponential retry in onboarding

**File:** `hooks/store/use-onboarding/index.ts` (lines 195-296)

Both `doRegisterWallets` and `doStartLinking` duplicate the retry pattern.

**Fix:** Extract `withExponentialRetry` helper.

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

### 24. Inconsistent disabled button opacity

| File | Value |
|------|-------|
| `views/account/account-content.tsx:91` | `opacity: 0.6` |
| `views/swap/.../swap-form-button/index.tsx:81` | `opacity: 0.4` |

**Fix:** Standardize to one value (recommend `0.5`) and extract as a CSS variable or constant.

---

### 25. Inconsistent CTA button animations

`SwapFormButton` uses spring animations + `cta-ready-pulse` class. `WithdrawView` button uses `transition-colors duration-200` with no spring or pulse. All primary CTAs should be consistent.

**Fix:** Ensure all primary CTAs use the same motion treatment.

---

### 26. Missing signature verification before on-chain execution

**File:** `lib/privy/signing.ts` (lines 46-90)

`signAndExecuteSuiTransaction` doesn't verify signatures locally before submitting. The CLAUDE.md guidelines explicitly require this:
```typescript
import { ed25519 } from '@noble/curves/ed25519';
const valid = ed25519.verify(signature, message, publicKey);
if (!valid) throw new Error('Signature verification failed locally');
```

---

### 27. Unsafe response casting in Solver/Enclave

| File | Line | Issue |
|------|------|-------|
| `lib/solver/server.ts` | 41-42 | `return json.data as T` without validating `data` key exists |
| `lib/enclave/server.ts` | 30, 45 | `return response.json() as Promise<T>` — incorrect cast |

**Fix:** Validate response shape before casting, or use Zod on responses.

---

### 28. `Percent.feeFrom` rounding edge case

**File:** `lib/entities/percent.ts` (lines 24-36)

With high fee percentages on tiny amounts, `feeRounded > rawValue` makes `afterFee` negative.

**Fix:** Add a guard: `const afterFee = rawValue > feeRounded ? rawValue - feeRounded : 0n;`

---

### 29. `invariant()` misuse in API routes (5+ locations)

Bridge routes use `invariant()` which throws generic errors caught by catch-all handlers. Users see "Bridge failed" instead of specific validation errors.

**Files:**
- `app/api/xbridge/bridge-burn/create/route.ts:96-99`
- `bridge-burn/sign/route.ts:39, 66`
- `bridge-mint/route.ts:78-81`

**Note:** `bridge-burn/wait-signature/route.ts` was deleted (no longer applicable).

**Fix:** Replace with explicit checks that return `NextResponse.json({ error }, { status: 400 })`.

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

### 34. Missing `Cache-Control: no-store` on mutation endpoints

**Files:** `send-solana`, `send-sui`, `create-nonce` routes don't set cache headers on POST responses.

**Fix:** Add to all mutation responses:
```typescript
headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
```

---

### 35. Solana message builder has no input validation

**File:** `lib/solana/solana-message.ts` (lines 36-60)

No checks that addresses are 32 bytes, amount is non-negative, or amount fits u64.

**Fix:** Add assertions at function entry:
```typescript
if (dWallet.length !== 32) throw new Error('dWallet must be 32 bytes');
```

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

### 42. Misplaced `REQUEST_DEADLINE_MS`

**File:** `constants/coins.ts` (line 9) — This timeout constant has nothing to do with coin metadata. Move to `constants/timeouts.ts`.

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

### 47. Decorative `<hr>` elements missing `aria-hidden="true"`

**File:** `components/composed/panel-content/index.tsx` (lines 40, 42, 49, 54, 59, 66)

---

### 48. SVG spinners missing `aria-hidden="true"`

**File:** `components/ui/toast/toast-loading.tsx` (line 22)

**Note:** `components/ui/spinner/index.tsx` was updated to use `role="status"` with `aria-label="Loading"` — properly accessible now.

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
| **#3** | Race condition in IKA client init | Open |
| **#4** | Memory leak in RPC caches | Open |
| **#5** | Missing Zod array size validation | **FIXED** |
| **#6** | Missing API param validation | **FIXED** |
| **#7** | `Fraction.invert()` zero denominator | **FIXED** |
| **#13** | Duplicate retry loop pattern | **FIXED** (prior) |
| **#20** | Refs that never reset | **FIXED** |
| **#31** | Debug console.logs in use-bridge | **FIXED** |
| **#32** | Hardcoded magic byte offsets | **FIXED** |
| **#38** | use-swap ref pattern | Acceptable (React Compiler) |
| **#41** | Unused ZERO_BIG_INT export | **RESOLVED** |
| **#46** | Trade.rate dead math | **FIXED** |
| **#52** | use-safe-height double listeners | **FIXED** (prior) |
| **#55** | Silent error swallowing in use-login-identity | **FIXED** |

**Total: 12 items fully fixed, 2 partially mitigated, 1 resolved as acceptable**

---

## Recommended Action Plan (Remaining)

| Priority | Action | Impact | Effort |
|----------|--------|--------|--------|
| **P0** | Fix RPC client cache leak (#4) | Memory | Small |
| **P0** | Fix IKA client init race (#3) | Reliability | Medium |
| **P1** | Create `constants/animations.ts` (#8) | DRY (6 files) | Small |
| **P1** | Extract shared utils (decimal input, balance calc, explorer URLs, health) (#9-12,14) | DRY (14 files) | Medium |
| **P1** | Extract `withExponentialRetry` helper (#21) | DRY | Small |
| **P1** | Type `useWatch` calls properly (#22) | Type safety (8 files) | Medium |
| **P2** | Standardize API route error handling + logging (#23) | Consistency | Medium |
| **P2** | Add signature verification before on-chain exec (#26) | Security | Small |
| **P2** | Replace `invariant()` in API routes with explicit responses (#29) | UX | Small |
| **P2** | Standardize hook return shapes (#33) | DX | Medium |
| **P3** | Accessibility fixes (aria-hidden, labels) (#47-48) | A11y | Small |
| **P3** | Clean up misplaced constants (#42) | Hygiene | Small |
| **P3** | Add test coverage for critical paths (#57) | Reliability | Large |

---

*Generated by Claude Code full codebase audit. Review periodically and check off items as they are resolved.*
