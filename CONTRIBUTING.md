# Contributing

## Before You Start

1. Use Node.js `22.x`.
2. Install dependencies with `pnpm install`.
3. Configure env vars needed by `lib/config.ts` and `lib/config.server.ts`.

## Project Structure

- `app/` — Next.js App Router pages, layouts, route handlers.
- `views/` — page-level view composition.
- `components/` — UI building blocks and providers.
- `hooks/` — store, domain, blockchain, and UI hooks.
- `lib/` — protocol clients, adapters, entities, API utilities.
- `constants/` — chain/token/rpc and shared app constants.
- `utils/` — pure utility helpers.

## Local Quality Gate

Run this before opening a PR:

```bash
pnpm typecheck
pnpm lint
pnpm test:run
```

If needed:

```bash
pnpm lint:fix
pnpm format
```

## Code Standards

- Use TypeScript strict types; avoid `any`.
- Follow established folder/module patterns from `CLAUDE.md`.
- Keep business logic in hooks/lib, not in UI primitives.
- Use Biome for linting/formatting (not ESLint/Prettier in this repo).

## Commits

- Follow the Gitmoji commitlint format configured in this project.
- Keep commit scope focused and include tests when behavior changes.

## AI-Specific Notes

When an AI assistant contributes:

1. Read `frontend/CLAUDE.md` before editing.
2. Verify assumptions against existing code (routes, env vars, constants).
3. Avoid broad refactors unless explicitly requested.
4. Include exact file paths and verification commands in handoff notes.
