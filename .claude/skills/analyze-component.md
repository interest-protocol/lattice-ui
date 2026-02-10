---
name: analyze-component
description: Analyze a component against Lattice UI project patterns and quality standards
user_invocable: true
---

# Analyze Component

Analyze the specified component(s) against Lattice UI project conventions and report findings.

## Instructions

1. **Read the component files** (index.tsx + *.types.ts if present)
2. **Check each item** in the checklist below
3. **Report findings** organized by category with file:line references

## Checklist

### Stylin.js Usage
- [ ] Uses `Div`, `Span`, `Button`, `Input` from `@stylin.js/elements` (not raw HTML)
- [ ] Responsive values use arrays: `p={['0.5rem', '1rem', '2rem']}`
- [ ] Hover states use `nHover={{ ... }}` prop
- [ ] No inline `style={{}}` props (use Stylin.js props instead)

### Color Constants
- [ ] Uses `ACCENT`, `ACCENT_HOVER`, `ACCENT_80`, `ACCENT_4D` from `@/constants/colors`
- [ ] No hard-coded color hex values (check for `#` followed by 3-8 hex chars)
- [ ] Opacity variants use proper constants, not inline alpha

### Type Safety
- [ ] Props interface defined in `*.types.ts` file
- [ ] No `any` type usage
- [ ] No `@ts-ignore` or `@ts-expect-error`
- [ ] No `as never` or `as unknown` type casts
- [ ] Proper discriminated unions for state (if applicable)

### Component Patterns
- [ ] Follows layer hierarchy (ui < composed < layout < providers)
- [ ] Uses composition over prop drilling
- [ ] Thin page wrappers delegate to view components
- [ ] Side-effect providers return `null`
- [ ] Uses `'use client'` directive if needed (hooks, event handlers)

### State Management
- [ ] Zustand selectors use `useShallow` to prevent re-renders
- [ ] Form state uses `react-hook-form` (not manual useState for forms)
- [ ] No unnecessary `useState` — prefer derived values
- [ ] Complex state extracted into custom hook

### Memoization
- [ ] `useMemo` for expensive calculations only
- [ ] `useCallback` for handlers passed to children
- [ ] No over-memoization (simple booleans, string concatenation)
- [ ] Proper dependency arrays (no missing deps, no unnecessary deps)

### Error Handling
- [ ] Async operations have try/catch
- [ ] User-facing errors show toast notifications
- [ ] Loading states handled (`isLoading` checks)
- [ ] Error states handled (not silently swallowed)

### Accessibility
- [ ] Icon-only buttons have `aria-label`
- [ ] Interactive elements are focusable
- [ ] Modals trap focus
- [ ] Tabs have proper ARIA roles (`tablist`, `tab`, `tabpanel`)
- [ ] Color is not the only indicator of state

### Imports
- [ ] Uses `@/` path alias (not relative `../../`)
- [ ] Barrel imports from index files
- [ ] No unused imports (Biome enforces this)

### Naming
- [ ] File: `kebab-case/index.tsx`
- [ ] Types file: `component-name.types.ts`
- [ ] Props: `on{Event}` for callbacks
- [ ] Handlers: `handle{Event}` for implementations
- [ ] Component: PascalCase

## Output Format

```
## Analysis: {ComponentName}

### Summary
{1-2 sentence overall assessment}

### Issues Found
1. **[Category]** file:line — Description
2. ...

### Good Practices
- {patterns done well}

### Recommendations
- {actionable improvements}
```
