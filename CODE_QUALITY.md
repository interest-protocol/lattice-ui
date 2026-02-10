# Code Quality Report - Lattice UI

## Scorecard

| Category | Grade | Notes |
|----------|-------|-------|
| **Type Safety** | A+ | Strict TS, zero `any` in source, zero `@ts-ignore` |
| **Security** | A+ | Zod validation on all API routes, env vars for secrets, no `eval`/`dangerouslySetInnerHTML` |
| **Performance** | A | Strategic memoization, SWR deduping, one O(n^2) canvas concern |
| **Error Handling** | B+ | Comprehensive in domain hooks, silent in data-fetching hooks |
| **Code Organization** | A | Clear 4-layer hierarchy, clean barrel exports |
| **DRY** | B | Some duplication in wallet extraction, settings menus, copy-to-clipboard |
| **Accessibility** | C+ | Toggle and modal have basics, many gaps in icon buttons and ARIA |
| **Overall** | **A-** | Production-quality codebase with targeted areas for improvement |

---

## Strengths

### Type Safety (Excellent)

- **Zero `any` usage** in application source code
- **Zero `@ts-ignore` / `@ts-expect-error`** comments
- **Only 3 Biome lint suppressions**, all justified and documented:
  1. `hooks/domain/use-metadata/index.ts:8` — array dependency derived from string key
  2. `components/layout/background/background-provider.ts:12` — intentional mount-only effect
  3. `components/providers/app-state-provider/index.tsx:15` — intentional mount-only initialization
- **TypeScript strict mode** enabled (`tsconfig.json: "strict": true`)
- **Discriminated unions** for state machines (`SwapStatus`, `BridgeStatus`)
- **Entity classes** with private constructors enforcing factory pattern

### Security (Excellent)

- **Zod validation** on every API route (`lib/api/validate-params.ts`)
- **All secrets** externalized via `NEXT_PUBLIC_*` environment variables
- **No hardcoded credentials** in source code
- **No `eval()`** or `Function()` constructor usage
- **No `dangerouslySetInnerHTML`** anywhere
- **Exponential backoff retry** in wallet registration (prevents thundering herd)
- **Ref-based concurrency guards** prevent duplicate async operations

### Error Handling (Strong in Domain Layer)

- **ErrorBoundary** at app root with dev-mode error display and retry
- **Domain hooks** (`useSwap`, `useBridge`) have comprehensive try/catch with:
  - Status state machine transitions
  - User-friendly toast notifications
  - Error message extraction utility
- **Wallet registration** has retry with backoff ([2s, 5s, 10s], max 3 attempts)
- **Proper `finally` blocks** reset concurrency flags

### Performance (Good)

- **Zustand selector pattern** with `useShallow` prevents unnecessary re-renders
- **`useMemo`** applied strategically to expensive calculations (validation, address extraction)
- **`useCallback`** used for handlers passed to children
- **SWR deduping** (5s interval) prevents duplicate network requests
- **Dynamic imports** with `ssr: false` for wallet-dependent components
- **No inline arrow functions** in JSX render paths

### Code Organization (Strong)

- **4-layer component hierarchy**: providers > layout > composed > ui
- **4-layer hook hierarchy**: store > blockchain > domain > ui
- **Consistent file naming**: `kebab-case/index.tsx` + `*.types.ts`
- **Barrel exports** in all directories
- **Enum-based configuration** with parallel lookup tables (RPC, Explorer)
- **Chain registry pattern** as single source of truth for chain config

---

## Anti-Patterns Found

### 1. Hard-Coded Colors (~100+ instances)

**Severity: Medium** | **Impact: Maintainability**

Color hex values are scattered throughout components instead of using the constants in `constants/colors.ts`:

```
components/providers/modal-provider/index.tsx  — '#FFFFFF', '#00000080'
components/composed/header/navbar/index.tsx    — '#A78BFA', '#FFFFFF80'
components/composed/settings/                  — '#FFFFFF0D', '#FFFFFF1A'
components/ui/toast/toast-error.tsx             — '#F04248'
components/ui/toast/toast-success.tsx           — '#00DF80'
app/providers.tsx                               — '#242C32', '#FFFFFF0D'
```

Only 4 colors are defined as constants (`ACCENT`, `ACCENT_HOVER`, `ACCENT_80`, `ACCENT_4D`).

**Recommendation:** Create a `constants/theme.ts` with named colors for backgrounds, borders, text, states, and toast colors.

### 2. Code Duplication

**Severity: Medium** | **Impact: DRY**

| Pattern | Locations | Description |
|---------|-----------|-------------|
| Wallet address extraction | `wallet-profile/index.tsx` (address parsing repeated) | Same Privy `linkedAccounts` parsing in 2+ places |
| Copy-to-clipboard | `wallet-profile-dropdown.tsx`, `deposit-view.tsx` | Same `navigator.clipboard.writeText` + toast pattern |
| Settings menus | `settings-menu-explorer.tsx`, `settings-menu-rpc.tsx` | Nearly identical expand/collapse/select logic |
| `borderRadius: '50%'` | 4 inline style instances | Same pattern across send-modal, withdraw-view, bridge-form, wallet-profile |

### 3. Silent Error Handling in Data Hooks

**Severity: Medium** | **Impact: Debuggability**

Four data-fetching hooks do not expose error state to consumers:

| Hook | Behavior |
|------|----------|
| `use-sui-balances` | SWR error swallowed, returns `undefined` data |
| `use-solana-balances` | SWR error swallowed, returns `undefined` data |
| `use-sui-price` | Falls back to `0` on error, masking failures |
| `use-health` | SWR error swallowed, returns `null` data |

**Recommendation:** Return `{ data, error, isLoading }` tuple from all data hooks.

### 4. `ref as never` Type Casting

**Severity: Low** | **Impact: Type Safety**

```typescript
// components/composed/wallet-button/wallet-profile/index.tsx:66
ref={dropdownRef as never}
```

Single instance of type casting to work around ref incompatibility.

### 5. useNetwork Is Not a Hook

**Severity: Low** | **Impact: Conventions**

```typescript
// hooks/store/use-network/index.ts
export const useNetwork = () => Network.MAINNET;
```

Contains no React hooks — could be a plain constant.

### 6. Dead Code: SettingsMenuFastMode

**Severity: Low** | **Impact: Bundle Size**

`components/composed/settings/settings-menu/settings-menu-fast-mode.tsx` exists but is not rendered in the settings menu.

### 7. Bridge Orchestrator Complexity

**Severity: Low** | **Impact: Readability**

`views/swap/components/bridge/index.tsx` has ~11 `useState` hooks. Consider extracting a `useBridgeForm()` custom hook.

---

## Accessibility Gaps

### Missing ARIA Labels

| Component | Issue |
|-----------|-------|
| `wallet-button` (all states) | Icon-only buttons lack `aria-label` |
| `settings/index.tsx` | Cog/bars icon button has no accessible name |
| `health-indicator` | Status dot has no `aria-label` for screen readers |
| `input-field-asset.tsx` | Token selector button lacks description |

### Focus Management

| Component | Issue |
|-----------|-------|
| `modal-provider` | No focus trap — Tab can escape modal |
| `modal-provider` | Focus not returned to trigger element on close |
| `settings-menu` | No arrow key navigation for menu items |

### ARIA Roles

| Component | Issue |
|-----------|-------|
| `tabs/index.tsx` | Missing `role="tablist"`, `role="tab"`, `aria-selected` |
| `tooltip/index.tsx` | Not keyboard accessible (hover-only) |

### Color-Only Indicators

| Component | Issue |
|-----------|-------|
| `health-indicator` | Health status communicated only via color dot |
| `toast-error/success` | Relies on red/green color distinction |

### Existing Good Practices

- Toggle: proper `<label>` + hidden `<input>` + `role="switch"`
- Modal: ESC key support with visible hint
- SVGs: `aria-hidden` on decorative icons

---

## Performance Considerations

### 1. O(n^2) Particle Connections

`components/layout/background/background-particles.tsx` calculates connections between all particle pairs:

```typescript
// Every frame: checks distance between every pair
for (let i = 0; i < particles.length; i++) {
  for (let j = i + 1; j < particles.length; j++) {
    // draw line if close enough
  }
}
```

With ~50-100 particles, this is 1,225-4,950 comparisons per frame at 60fps.

**Recommendation:** Use spatial partitioning or limit connection checks to nearest neighbors.

### 2. No Asset List Virtualization

Token selection modals render all tokens without virtualization. Currently manageable with small token lists but could degrade with more assets.

### 3. Mouse Tracking Without Throttling

`components/layout/layout/index.tsx` tracks mouse position on every `mousemove` event for parallax background. Could benefit from `requestAnimationFrame` throttling.

### 4. Form Re-render Cascade

`react-hook-form` `useWatch()` in `input-field` sub-components causes re-renders on every keystroke. The `useMemo` on validation prevents expensive recalculations, but the render cycle itself is broad.

---

## Recommended Improvements (Priority Order)

### High Impact

1. **Create theme constants** — Centralize all colors into `constants/theme.ts` to replace 100+ hard-coded hex values
2. **Expose error state from data hooks** — Return `{ data, error, isLoading }` from balance/price hooks
3. **Add ARIA labels to icon buttons** — Quick accessibility win across header, settings, wallet components

### Medium Impact

4. **Extract `useBridgeForm` hook** — Move bridge's 11 useState calls + validation logic into custom hook
5. **DRY up copy-to-clipboard** — Create `utils/clipboard.ts` helper
6. **Add focus trap to modal** — Use `focus-trap-react` or manual implementation
7. **Add ARIA roles to tabs** — `role="tablist"` + `role="tab"` + `aria-selected`

### Low Impact

8. **Remove dead SettingsMenuFastMode** — Or wire it up if intended
9. **Convert useNetwork to constant** — It uses no React hooks
10. **Throttle mouse tracking** — `requestAnimationFrame` wrapper for parallax
11. **Consider spatial partitioning** — For particle connection rendering

---

## Tooling Configuration

### Biome (Linter + Formatter)

```json
{
  "linter": {
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedImports": "error",
        "noUnusedVariables": "error",
        "useExhaustiveDependencies": "warn"
      },
      "style": { "noNonNullAssertion": "off" },
      "suspicious": { "noExplicitAny": "off" },
      "a11y": { "noSvgWithoutTitle": "off" }
    }
  },
  "formatter": {
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 80
  }
}
```

Note: While `noExplicitAny` is set to "off", the codebase has zero `any` usage regardless — the team maintains this discipline without enforcement.

### TypeScript

- `"strict": true`
- Target: ES2020
- Module: ESNext with Node resolution
- Incremental compilation enabled

### Git Hooks (Husky + Commitlint)

- Commit messages enforced via `commitlint-config-gitmoji`
- Husky runs pre-commit checks

---

*Report generated: 2026-02-10*
*Files analyzed: ~208 TypeScript/React source files*
