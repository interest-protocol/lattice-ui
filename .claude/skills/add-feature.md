---
name: add-feature
description: Add a new feature to Lattice UI following project conventions
user_invocable: true
---

# Add Feature

Guide for adding a new feature to the Lattice UI codebase following established patterns and conventions.

## Instructions

When the user describes a feature to add, follow these steps:

### Step 1: Classify the Feature

Determine which layers are affected:

| Layer | When to touch |
|-------|--------------|
| `components/ui/` | New reusable primitive (button variant, badge, etc.) |
| `components/composed/` | New feature component (token selector, chart, etc.) |
| `components/layout/` | Page structure changes |
| `components/providers/` | New context or side-effect provider |
| `hooks/store/` | New global state (Zustand store) |
| `hooks/blockchain/` | New chain data fetching |
| `hooks/domain/` | New business logic orchestration |
| `hooks/ui/` | New component utility |
| `lib/` | New SDK client, entity, or adapter |
| `constants/` | New configuration values |
| `utils/` | New pure utility function |
| `views/` | New page-level view |
| `app/api/` | New API route handler |

### Step 2: Create Files Following Conventions

**Component template:**
```
components/{layer}/{feature-name}/
├── index.tsx                    # Main component
└── {feature-name}.types.ts      # Props interface
```

```typescript
// {feature-name}.types.ts
import type { ReactNode } from 'react';

export interface FeatureNameProps {
  children?: ReactNode;
}

// index.tsx
'use client';

import type { FC } from 'react';
import type { FeatureNameProps } from './{feature-name}.types';

const FeatureName: FC<FeatureNameProps> = ({ children }) => {
  return <div>{children}</div>;
};

export default FeatureName;
```

**Hook template:**
```
hooks/{layer}/use-{name}/
└── index.ts
```

```typescript
// index.ts
import { useMemo } from 'react';

export const useFeatureName = () => {
  // Hook logic here
  return useMemo(() => ({
    // Return value
  }), []);
};
```

**API route template:**
```
app/api/{service}/{action}/
└── route.ts
```

```typescript
// route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { validateBody } from '@/lib/api/validate-params';

const schema = z.object({
  // Request validation
});

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { data, error } = validateBody(body, schema);
    if (error) return error;
    // Implementation using `data`
    return NextResponse.json({ data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
};
```

### Step 3: Follow These Rules

**Styling:**
- Use Tailwind CSS v4 utility classes on native HTML elements
- Use color constants from `@/constants/colors` — never hard-code hex values
- Use responsive prefixes: `sm:`, `md:`, `lg:`, `xl:`
- Use `hover:` prefix for interaction states
- Use `motion.div` from `motion/react` for animations

**State:**
- Use Zustand with `useShallow` selectors for global state
- Use TanStack Query v5 (`useQuery`) for server-state with appropriate `staleTime`/`refetchInterval`
- Use React Hook Form for form state
- Use `useLocalStorage` from `usehooks-ts` for persistence

**Token math:**
- Always use native `BigInt` for token amounts
- Use `CurrencyAmount` and `Token` entities from `@/lib/entities`
- Use `parseUnits()` / `formatUnits()` from `@/lib/bigint-utils` for decimal conversion
- Never use floating-point arithmetic for financial values

**Error handling:**
- Wrap async operations in try/catch
- Show user-facing errors via `toasting.error()` from `@/components/ui/toast`
- Extract error messages with `extractErrorMessage()` from `@/utils`
- API routes must validate with Zod and return proper HTTP status codes

**Imports:**
- Always use `@/` path alias
- Import types with `import type { ... }`
- Use barrel exports (`index.ts`) for directories

### Step 4: Verification Checklist

Before considering the feature complete:

- [ ] TypeScript compiles: `pnpm build` or `npx tsc --noEmit`
- [ ] Biome passes: `pnpm lint`
- [ ] No hard-coded colors — uses constants
- [ ] No `any` types
- [ ] Icon buttons have `aria-label`
- [ ] Loading states handled
- [ ] Error states handled with user-visible feedback
- [ ] Zustand selectors use `useShallow`
- [ ] File naming follows `kebab-case/index.tsx` convention
- [ ] Types in separate `*.types.ts` file
- [ ] Imports use `@/` alias
