# HR Tech — Monorepo

Documentação completa em [`docs/`](./docs) — comece por [`docs/architecture.md`](./docs/architecture.md).

## Requisitos
- Node.js 20+
- pnpm 9+ (`corepack enable`)
- Docker (para Postgres local)

## Setup

```bash
pnpm install
docker compose up -d postgres
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
pnpm --filter @hrtech/api prisma:generate
```

## Desenvolvimento

```bash
pnpm dev
```

Sobe `apps/web` em http://localhost:3000 e `apps/api` em http://localhost:3001.

## Testes

```bash
pnpm test
```
