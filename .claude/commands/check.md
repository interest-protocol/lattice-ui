Run all code quality checks (lint, typecheck, tests) in parallel and report a summary.

Steps:
1. Run these three commands in parallel:
   - `pnpm lint` (Biome lint + format)
   - `pnpm typecheck` (TypeScript `tsc --noEmit`)
   - `pnpm test:run` (Vitest)
2. After all three complete, print a summary table showing pass/fail status and error counts for each check.
3. If any check failed, list the specific errors concisely.
