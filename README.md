# Lattice UI

Frontend for the Lattice cross-chain swap and bridge experience.

## Stack

- Next.js 16 (App Router)
- React 19
- TypeScript (strict)
- Tailwind CSS v4
- Zustand + TanStack Query
- Biome (lint + format)
- pnpm

## Prerequisites

- Node.js `22.x` (see `package.json` engines)
- pnpm `9.x`

## Quick Start

```bash
pnpm install
cp .env.example .env.local # if available, otherwise create manually
pnpm dev
```

App runs at `http://localhost:3000`.

## Required Environment Variables

Client/runtime:

- `NEXT_PUBLIC_PRIVY_APP_ID`
- `NEXT_PUBLIC_SOLVER_API_URL`
- `NEXT_PUBLIC_SUI_RPC_URL` (optional, defaults to Sui mainnet fullnode)

Server/API routes:

- `PRIVY_APP_SECRET`
- `PRIVY_AUTHORIZATION_KEY`
- `ENCLAVE_URL`
- `ENCLAVE_API_KEY`
- `SOLVER_API_KEY`

## Development Commands

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm lint:fix
pnpm format
pnpm typecheck
pnpm test
pnpm test:run
pnpm test:e2e
```

## AI Agent Workflow

If an AI assistant is working in `frontend/`:

1. Read `CLAUDE.md` first for architecture and guardrails.
2. Prefer existing patterns over introducing new abstractions.
3. Keep pages thin (`app/**/page.tsx` should delegate to views/components).
4. Use Biome for style/lint fixes (`pnpm lint:fix`), not ESLint/Prettier.
5. Validate edits with `pnpm typecheck` and `pnpm lint` before finishing.

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md).
