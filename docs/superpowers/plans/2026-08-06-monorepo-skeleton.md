# Monorepo & Skeletons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the HR Tech monorepo end to end — shared config/types packages, a NestJS API with a working health check backed by Postgres, and a Next.js front-end that renders that health status server-side — so every later plan (Design System, Core backend, Contact module) has a running foundation to build on.

**Architecture:** Turborepo + pnpm workspace with `apps/{web,api}` and `packages/{config,types}`, per `docs/architecture.md` and `docs/adr/002-monorepo-and-tooling.md`. The API follows the Clean Architecture layering from `docs/adr/004-clean-architecture-backend.md` even for this trivial module, to establish the pattern every later module copies. This plan does **not** build any real page or the Design System — `app/page.tsx` here is a throwaway wiring check, replaced entirely when the Home page etapa starts.

**Tech Stack:** Turborepo 2, pnpm 9, TypeScript 5.7 (strict), NestJS 11, Prisma 6 (multi-file schema, no models yet), nestjs-pino, Next.js 15 (App Router, Server Components), Vitest 2 (+ unplugin-swc for NestJS decorator metadata), Docker multi-stage builds via `turbo prune --docker`.

## Global Constraints

- TypeScript `strict: true` everywhere — no unjustified `any` (`docs/coding-standards.md`)
- Every back-end module follows `domain/application/infrastructure/presentation`, even trivial ones (`docs/adr/004-clean-architecture-backend.md`)
- Security baseline implemented at API bootstrap, not deferred: Helmet, explicit CORS origin (no wildcard), `class-validator` global `ValidationPipe` with `whitelist: true`, `@nestjs/throttler` (`docs/adr/008-security-baseline.md`)
- Structured logging via `pino`, never `console.log` (`docs/architecture.md` §8)
- Health endpoints: `GET /health`, `GET /health/live`, `GET /health/ready` (`docs/architecture.md` §8)
- Vitest for unit tests (`docs/architecture.md` §14, `docs/coding-standards.md`)
- Conventional Commits format (`docs/coding-standards.md`)
- File naming: `kebab-case.ts` for back-end/util files, `PascalCase.tsx` for React components, `*.spec.ts` for unit tests, `*.e2e-spec.ts` for e2e tests (`docs/coding-standards.md`)
- No invented data anywhere, including placeholder/fixture content (`docs/product-vision.md`)
- Docker: multi-stage builds; Next.js `output: 'standalone'` (`docs/architecture.md` §13)
- Architecture is frozen at v1.0 — any structural deviation from this plan needs a new ADR first, not a silent change (`docs/adr/009-architecture-freeze-v1.md`)

---

### Task 1: Monorepo root

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `.gitignore`
- Create: `docker-compose.yml`

**Interfaces:**
- Produces: pnpm workspace resolving `apps/*` and `packages/*`; `turbo run <task>` dispatches `dev`/`build`/`lint`/`test`/`typecheck` across all workspace packages; a `postgres` service on `localhost:5432` (user `hrtech`, password `hrtech_dev_password`, db `hrtech`) for every later task that needs a database.

- [ ] **Step 1: Create root `package.json`**

```json
{
  "name": "hrtech-site",
  "private": true,
  "packageManager": "pnpm@9.15.0",
  "engines": {
    "node": ">=20"
  },
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "typecheck": "turbo run typecheck"
  },
  "devDependencies": {
    "turbo": "^2.3.3"
  }
}
```

- [ ] **Step 2: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 3: Create `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    }
  }
}
```

- [ ] **Step 4: Create `.gitignore`**

```
node_modules/
.turbo/
dist/
.next/
out/
coverage/
.env
.env.local
*.log
.DS_Store
```

- [ ] **Step 5: Create `docker-compose.yml`**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: hrtech
      POSTGRES_PASSWORD: hrtech_dev_password
      POSTGRES_DB: hrtech
    ports:
      - "5432:5432"
    volumes:
      - hrtech_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U hrtech"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  hrtech_postgres_data:
```

- [ ] **Step 6: Verify install and Postgres**

Run: `pnpm install`
Expected: completes with no errors, creates `pnpm-lock.yaml` (workspace has no packages yet, so this just confirms tooling works)

Run: `docker compose up -d postgres`
Expected: container starts; `docker compose ps` shows `postgres` as `healthy` within ~10s

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-workspace.yaml turbo.json .gitignore docker-compose.yml pnpm-lock.yaml
git commit -m "chore: scaffold monorepo root (turborepo + pnpm + local postgres)"
```

---

### Task 2: `packages/config` — shared TypeScript and ESLint config

**Files:**
- Create: `packages/config/package.json`
- Create: `packages/config/typescript/base.json`
- Create: `packages/config/typescript/nextjs.json`
- Create: `packages/config/typescript/nestjs.json`
- Create: `packages/config/eslint/base.mjs`
- Create: `packages/config/eslint/nextjs.mjs`
- Create: `packages/config/eslint/nestjs.mjs`

**Interfaces:**
- Produces: `@hrtech/config` package exporting `typescript/{base,nextjs,nestjs}.json` (extendable tsconfigs) and `eslint/{base,nextjs,nestjs}.mjs` (flat ESLint configs), consumed by `apps/api` and `apps/web` from Task 4 onward.

- [ ] **Step 1: Create `packages/config/package.json`**

```json
{
  "name": "@hrtech/config",
  "version": "0.0.0",
  "private": true,
  "files": ["typescript", "eslint"],
  "devDependencies": {
    "typescript": "^5.7.2",
    "eslint": "^9.17.0",
    "typescript-eslint": "^8.18.0",
    "eslint-config-prettier": "^9.1.0",
    "@eslint/eslintrc": "^3.2.0",
    "@eslint/js": "^9.17.0"
  }
}
```

- [ ] **Step 2: Create `packages/config/typescript/base.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "moduleResolution": "Bundler",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noUncheckedIndexedAccess": true
  }
}
```

- [ ] **Step 3: Create `packages/config/typescript/nextjs.json`**

```json
{
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "ES2022"],
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowJs": true,
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "noEmit": true
  }
}
```

- [ ] **Step 4: Create `packages/config/typescript/nestjs.json`**

```json
{
  "extends": "./base.json",
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "Node",
    "lib": ["ES2022"],
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "declaration": true,
    "sourceMap": true
  }
}
```

- [ ] **Step 5: Create `packages/config/eslint/base.mjs`**

```js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    ignores: ['dist/**', '.next/**', 'node_modules/**'],
  },
);
```

- [ ] **Step 6: Create `packages/config/eslint/nextjs.mjs`**

```js
import { FlatCompat } from '@eslint/eslintrc';
import base from './base.mjs';

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

export default [...base, ...compat.extends('next/core-web-vitals')];
```

- [ ] **Step 7: Create `packages/config/eslint/nestjs.mjs`**

```js
import base from './base.mjs';

export default [
  ...base,
  {
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
];
```

- [ ] **Step 8: Verify the base tsconfig is valid**

Run: `pnpm install`
Expected: no errors

Run: `pnpm exec tsc --showConfig -p packages/config/typescript/base.json`
Expected: prints the resolved compiler options as JSON, no error

- [ ] **Step 9: Commit**

```bash
git add packages/config
git commit -m "chore(config): add shared tsconfig and eslint flat configs"
```

---

### Task 3: `packages/types` — shared `HealthStatus` contract

**Files:**
- Create: `packages/types/package.json`
- Create: `packages/types/tsconfig.json`
- Create: `packages/types/vitest.config.ts`
- Create: `packages/types/src/health.ts`
- Test: `packages/types/src/health.test.ts`
- Create: `packages/types/src/index.ts`

**Interfaces:**
- Produces: `HealthStatus` type (`{ status: 'ok' | 'error'; service: string; timestamp: string }`) and `isHealthStatus(value: unknown): value is HealthStatus` type guard, exported from `@hrtech/types`. Used by `apps/api`'s health module (Task 6) to build the response and by `apps/web`'s fetch helper (Task 7) to validate it.

- [ ] **Step 1: Create `packages/types/package.json`**

```json
{
  "name": "@hrtech/types",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@hrtech/config": "workspace:*",
    "typescript": "^5.7.2",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: Create `packages/types/tsconfig.json`**

```json
{
  "extends": "@hrtech/config/typescript/base.json",
  "compilerOptions": {
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `packages/types/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
```

- [ ] **Step 4: Write the failing test**

`packages/types/src/health.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { isHealthStatus } from './health';

describe('isHealthStatus', () => {
  it('returns true for a valid health status object', () => {
    expect(
      isHealthStatus({ status: 'ok', service: 'api', timestamp: '2026-01-01T00:00:00.000Z' }),
    ).toBe(true);
  });

  it('returns false when status is not ok or error', () => {
    expect(
      isHealthStatus({ status: 'pending', service: 'api', timestamp: '2026-01-01T00:00:00.000Z' }),
    ).toBe(false);
  });

  it('returns false for null', () => {
    expect(isHealthStatus(null)).toBe(false);
  });

  it('returns false when required fields are missing', () => {
    expect(isHealthStatus({ status: 'ok' })).toBe(false);
  });
});
```

- [ ] **Step 5: Install dependencies and run the test to verify it fails**

Run: `pnpm install`

Run: `pnpm --filter @hrtech/types test`
Expected: FAIL — `Cannot find module './health'` (file doesn't exist yet)

- [ ] **Step 6: Write the minimal implementation**

`packages/types/src/health.ts`:

```ts
export type ServiceStatus = 'ok' | 'error';

export interface HealthStatus {
  status: ServiceStatus;
  service: string;
  timestamp: string;
}

export function isHealthStatus(value: unknown): value is HealthStatus {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    (v.status === 'ok' || v.status === 'error') &&
    typeof v.service === 'string' &&
    typeof v.timestamp === 'string'
  );
}
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `pnpm --filter @hrtech/types test`
Expected: PASS — 4 tests passing

- [ ] **Step 8: Create the barrel export**

`packages/types/src/index.ts`:

```ts
export * from './health';
```

- [ ] **Step 9: Commit**

```bash
git add packages/types
git commit -m "feat(types): add HealthStatus contract shared between api and web"
```

---

### Task 4: `apps/api` — NestJS bootstrap with security baseline

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/nest-cli.json`
- Create: `apps/api/.env.example`
- Create: `apps/api/.swcrc`
- Create: `apps/api/vitest.config.ts`
- Create: `apps/api/vitest.e2e.config.ts`
- Create: `apps/api/src/main.ts`
- Create: `apps/api/src/app.module.ts`

**Interfaces:**
- Produces: a bootable NestJS app on `PORT` (default 3001) with Helmet, explicit-origin CORS, global `ValidationPipe`, `pino` structured logging, and `ThrottlerModule` registered globally (100 req/min default) — `AppModule` is the module later tasks add `PrismaModule` (Task 5) and `HealthModule` (Task 6) to.

- [ ] **Step 1: Create `apps/api/package.json`**

```json
{
  "name": "@hrtech/api",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "start": "node dist/main.js",
    "lint": "eslint \"src/**/*.ts\"",
    "test": "vitest run",
    "test:e2e": "vitest run --config vitest.e2e.config.ts",
    "typecheck": "tsc --noEmit",
    "prisma:generate": "prisma generate --schema=prisma/schema"
  },
  "prisma": {
    "schema": "prisma/schema"
  },
  "dependencies": {
    "@hrtech/types": "workspace:*",
    "@nestjs/common": "^11.0.1",
    "@nestjs/config": "^4.0.0",
    "@nestjs/core": "^11.0.1",
    "@nestjs/platform-express": "^11.0.1",
    "@nestjs/throttler": "^6.3.0",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.1",
    "helmet": "^8.0.0",
    "nestjs-pino": "^4.3.1",
    "pino-http": "^10.3.0",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@hrtech/config": "workspace:*",
    "@nestjs/cli": "^11.0.0",
    "@nestjs/testing": "^11.0.1",
    "@swc/core": "^1.10.1",
    "@types/node": "^22.10.2",
    "@types/supertest": "^6.0.2",
    "pino-pretty": "^13.0.0",
    "supertest": "^7.0.0",
    "typescript": "^5.7.2",
    "unplugin-swc": "^1.5.1",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: Create `apps/api/tsconfig.json`**

```json
{
  "extends": "@hrtech/config/typescript/nestjs.json",
  "compilerOptions": {
    "outDir": "./dist",
    "baseUrl": "./"
  },
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 3: Create `apps/api/nest-cli.json`**

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

- [ ] **Step 4: Create `apps/api/.env.example`**

```
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
DATABASE_URL="postgresql://hrtech:hrtech_dev_password@localhost:5432/hrtech?schema=public"
```

- [ ] **Step 5: Create `apps/api/.swcrc`**

NestJS decorator metadata (used for dependency injection) needs SWC configured with `decoratorMetadata` — Vitest's default esbuild transform does not emit it, which silently breaks DI in tests.

```json
{
  "jsc": {
    "parser": {
      "syntax": "typescript",
      "decorators": true
    },
    "transform": {
      "legacyDecorator": true,
      "decoratorMetadata": true
    },
    "target": "es2022"
  },
  "module": {
    "type": "es6"
  }
}
```

- [ ] **Step 6: Create `apps/api/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

export default defineConfig({
  plugins: [swc.vite()],
  test: {
    include: ['src/**/*.spec.ts'],
    environment: 'node',
  },
});
```

- [ ] **Step 7: Create `apps/api/vitest.e2e.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

export default defineConfig({
  plugins: [swc.vite()],
  test: {
    include: ['test/**/*.e2e-spec.ts'],
    environment: 'node',
    hookTimeout: 30000,
  },
});
```

- [ ] **Step 8: Create `apps/api/src/main.ts`**

```ts
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
        },
      },
    }),
  );

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
}

bootstrap();
```

- [ ] **Step 9: Create `apps/api/src/app.module.ts`**

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      },
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

- [ ] **Step 10: Verify it builds and boots**

Run: `pnpm install`

Run: `cp apps/api/.env.example apps/api/.env`

Run: `pnpm --filter @hrtech/api build`
Expected: PASS, `apps/api/dist/main.js` created

Run: `pnpm --filter @hrtech/api dev` (then stop with Ctrl+C after checking)
Expected: pino log line containing `Nest application successfully started`, no crash

- [ ] **Step 11: Commit**

```bash
git add apps/api .gitignore
git commit -m "feat(api): bootstrap NestJS with security baseline (helmet, cors, validation, throttling)"
```

---

### Task 5: `apps/api` — Prisma setup and `PrismaService`

**Files:**
- Create: `apps/api/prisma/schema/schema.prisma`
- Create: `apps/api/src/infra/prisma/prisma.service.ts`
- Test: `apps/api/src/infra/prisma/prisma.service.spec.ts`
- Create: `apps/api/src/infra/prisma/prisma.module.ts`
- Modify: `apps/api/package.json` (add `prisma`, `@prisma/client`)
- Modify: `apps/api/src/app.module.ts` (import `PrismaModule`)

**Interfaces:**
- Consumes: `DATABASE_URL` env var (from `apps/api/.env`, set in Task 4)
- Produces: `PrismaService` (extends `PrismaClient`, globally injectable via `PrismaModule`) with `isHealthy(): Promise<boolean>` — used by `GetReadinessUseCase` in Task 6, and by every future Core module's repositories (Plan 3).

- [ ] **Step 1: Add Prisma dependencies**

Modify `apps/api/package.json` — add to `"dependencies"`:

```json
    "@prisma/client": "^6.1.0",
```

Add to `"devDependencies"`:

```json
    "prisma": "^6.1.0",
```

- [ ] **Step 2: Create the Prisma schema (multi-file, no models yet)**

`apps/api/prisma/schema/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Core entities (`Tenant`, `User`, `Role`, ...) are added as separate files under `apps/api/prisma/schema/core/` in the "Back-end Core multi-tenant" plan — see `docs/adr/003-multi-tenant-strategy.md`. This file only carries the generator/datasource, so `prisma generate` works before any model exists.

- [ ] **Step 3: Write the failing test for `isHealthy`**

`apps/api/src/infra/prisma/prisma.service.spec.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  it('isHealthy returns true when the database responds', async () => {
    const service = new PrismaService();
    vi.spyOn(service, '$queryRaw').mockResolvedValue([{ '?column?': 1 }]);

    await expect(service.isHealthy()).resolves.toBe(true);
  });

  it('isHealthy returns false when the query throws', async () => {
    const service = new PrismaService();
    vi.spyOn(service, '$queryRaw').mockRejectedValue(new Error('connection refused'));

    await expect(service.isHealthy()).resolves.toBe(false);
  });
});
```

- [ ] **Step 4: Install and generate the Prisma client, then run the test to verify it fails**

Run: `pnpm install`

Run: `pnpm --filter @hrtech/api prisma:generate`
Expected: `Generated Prisma Client` message, no error

Run: `pnpm --filter @hrtech/api test -- prisma.service`
Expected: FAIL — `Cannot find module './prisma.service'`

- [ ] **Step 5: Write the minimal implementation**

`apps/api/src/infra/prisma/prisma.service.ts`:

```ts
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `pnpm --filter @hrtech/api test -- prisma.service`
Expected: PASS — 2 tests passing

- [ ] **Step 7: Create `PrismaModule` and wire it into `AppModule`**

`apps/api/src/infra/prisma/prisma.module.ts`:

```ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

Modify `apps/api/src/app.module.ts` — add the import to the `imports` array:

```ts
import { PrismaModule } from './infra/prisma/prisma.module';
```

```ts
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
```

- [ ] **Step 8: Verify the app still builds**

Run: `pnpm --filter @hrtech/api build`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add apps/api
git commit -m "feat(api): add Prisma with multi-file schema and PrismaService health check"
```

---

### Task 6: `apps/api` — Health module (Clean Architecture layers)

**Files:**
- Create: `apps/api/src/modules/core/health/domain/health-check.ts`
- Test: `apps/api/src/modules/core/health/domain/health-check.spec.ts`
- Create: `apps/api/src/modules/core/health/application/get-readiness.use-case.ts`
- Test: `apps/api/src/modules/core/health/application/get-readiness.use-case.spec.ts`
- Create: `apps/api/src/modules/core/health/presentation/health.controller.ts`
- Create: `apps/api/src/modules/core/health/health.module.ts`
- Modify: `apps/api/src/app.module.ts` (import `HealthModule`)
- Test: `apps/api/src/app.module.spec.ts`
- Test: `apps/api/test/health.e2e-spec.ts`

**Interfaces:**
- Consumes: `HealthStatus` from `@hrtech/types` (Task 3), `PrismaService.isHealthy()` from `apps/api/src/infra/prisma/prisma.service.ts` (Task 5)
- Produces: `GET /health/live` (always 200, no DB check), `GET /health/ready` and `GET /health` (200 when DB reachable, 503 otherwise) — the contract every later module's controller pattern follows.

- [ ] **Step 1: Write the failing test for the domain function**

`apps/api/src/modules/core/health/domain/health-check.spec.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildHealthStatus } from './health-check';

describe('buildHealthStatus', () => {
  const fixedNow = () => new Date('2026-01-01T00:00:00.000Z');

  it('returns status ok when healthy', () => {
    const result = buildHealthStatus('api', true, fixedNow);
    expect(result).toEqual({ status: 'ok', service: 'api', timestamp: '2026-01-01T00:00:00.000Z' });
  });

  it('returns status error when unhealthy', () => {
    const result = buildHealthStatus('api', false, fixedNow);
    expect(result.status).toBe('error');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @hrtech/api test -- health-check`
Expected: FAIL — `Cannot find module './health-check'`

- [ ] **Step 3: Write the domain implementation**

`apps/api/src/modules/core/health/domain/health-check.ts`:

```ts
import type { HealthStatus } from '@hrtech/types';

export function buildHealthStatus(
  service: string,
  isHealthy: boolean,
  now: () => Date = () => new Date(),
): HealthStatus {
  return {
    status: isHealthy ? 'ok' : 'error',
    service,
    timestamp: now().toISOString(),
  };
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `pnpm --filter @hrtech/api test -- health-check`
Expected: PASS — 2 tests passing

- [ ] **Step 5: Write the failing test for the use case**

`apps/api/src/modules/core/health/application/get-readiness.use-case.spec.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { GetReadinessUseCase } from './get-readiness.use-case';
import type { PrismaService } from '../../../../infra/prisma/prisma.service';

describe('GetReadinessUseCase', () => {
  it('returns ok when the database is healthy', async () => {
    const prisma = { isHealthy: vi.fn().mockResolvedValue(true) } as unknown as PrismaService;
    const useCase = new GetReadinessUseCase(prisma);

    const result = await useCase.execute();

    expect(result.status).toBe('ok');
    expect(result.service).toBe('api');
  });

  it('returns error when the database is unhealthy', async () => {
    const prisma = { isHealthy: vi.fn().mockResolvedValue(false) } as unknown as PrismaService;
    const useCase = new GetReadinessUseCase(prisma);

    const result = await useCase.execute();

    expect(result.status).toBe('error');
  });
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `pnpm --filter @hrtech/api test -- get-readiness`
Expected: FAIL — `Cannot find module './get-readiness.use-case'`

- [ ] **Step 7: Write the use case implementation**

`apps/api/src/modules/core/health/application/get-readiness.use-case.ts`:

```ts
import { Injectable } from '@nestjs/common';
import type { HealthStatus } from '@hrtech/types';
import { PrismaService } from '../../../../infra/prisma/prisma.service';
import { buildHealthStatus } from '../domain/health-check';

@Injectable()
export class GetReadinessUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(): Promise<HealthStatus> {
    const dbHealthy = await this.prisma.isHealthy();
    return buildHealthStatus('api', dbHealthy);
  }
}
```

- [ ] **Step 8: Run it to verify it passes**

Run: `pnpm --filter @hrtech/api test -- get-readiness`
Expected: PASS — 2 tests passing

- [ ] **Step 9: Create the controller**

`apps/api/src/modules/core/health/presentation/health.controller.ts`:

```ts
import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { GetReadinessUseCase } from '../application/get-readiness.use-case';
import { buildHealthStatus } from '../domain/health-check';

@Controller('health')
export class HealthController {
  constructor(private readonly getReadiness: GetReadinessUseCase) {}

  @Get('live')
  live() {
    return buildHealthStatus('api', true);
  }

  @Get('ready')
  async ready() {
    const status = await this.getReadiness.execute();
    if (status.status === 'error') {
      throw new ServiceUnavailableException(status);
    }
    return status;
  }

  @Get()
  async check() {
    return this.ready();
  }
}
```

- [ ] **Step 10: Create the module and wire it into `AppModule`**

`apps/api/src/modules/core/health/health.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { HealthController } from './presentation/health.controller';
import { GetReadinessUseCase } from './application/get-readiness.use-case';

@Module({
  controllers: [HealthController],
  providers: [GetReadinessUseCase],
})
export class HealthModule {}
```

Modify `apps/api/src/app.module.ts` — add the import:

```ts
import { HealthModule } from './modules/core/health/health.module';
```

```ts
    PrismaModule,
    HealthModule,
```

- [ ] **Step 11: Write the AppModule smoke test**

`apps/api/src/app.module.spec.ts`:

```ts
import { Test } from '@nestjs/testing';
import { describe, it, expect } from 'vitest';
import { AppModule } from './app.module';

describe('AppModule', () => {
  it('compiles the full dependency graph', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    expect(moduleRef).toBeDefined();
  });
});
```

Run: `pnpm --filter @hrtech/api test -- app.module`
Expected: PASS — confirms every module (`ConfigModule`, `LoggerModule`, `ThrottlerModule`, `PrismaModule`, `HealthModule`) wires together without a live database (`compile()` does not run `onModuleInit`)

- [ ] **Step 12: Write the e2e test**

`apps/api/test/health.e2e-spec.ts`:

```ts
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { HealthModule } from '../src/modules/core/health/health.module';
import { PrismaService } from '../src/infra/prisma/prisma.service';

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [HealthModule],
    })
      .overrideProvider(PrismaService)
      .useValue({ isHealthy: async () => true })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health/live returns 200 with status ok', async () => {
    const res = await request(app.getHttpServer()).get('/health/live');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /health/ready returns 200 with status ok when the db is healthy', async () => {
    const res = await request(app.getHttpServer()).get('/health/ready');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
```

Run: `pnpm --filter @hrtech/api test:e2e`
Expected: PASS — 2 tests passing (no live Postgres needed, `PrismaService` is overridden with a mock)

- [ ] **Step 13: Commit**

```bash
git add apps/api
git commit -m "feat(api): add health module with live/ready endpoints (domain/application/presentation)"
```

---

### Task 7: `apps/web` — Next.js skeleton wired to the API

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/next.config.ts`
- Create: `apps/web/tailwind.config.ts`
- Create: `apps/web/postcss.config.mjs`
- Create: `apps/web/vitest.config.ts`
- Create: `apps/web/.env.example`
- Create: `apps/web/app/globals.css`
- Create: `apps/web/app/layout.tsx`
- Create: `apps/web/app/page.tsx`
- Create: `apps/web/lib/get-api-health.ts`
- Test: `apps/web/lib/get-api-health.test.ts`

**Interfaces:**
- Consumes: `HealthStatus`, `isHealthStatus` from `@hrtech/types` (Task 3); `GET /health/ready` from `apps/api` (Task 6)
- Produces: `getApiHealth(): Promise<HealthStatus>` and a placeholder `app/page.tsx` proving the front-end can reach the back-end. **This page is temporary** — it is fully replaced when the Home page etapa starts with the real Design System.

- [ ] **Step 1: Create `apps/web/package.json`**

```json
{
  "name": "@hrtech/web",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3000",
    "build": "next build",
    "start": "next start",
    "lint": "eslint \"app/**/*.{ts,tsx}\" \"lib/**/*.ts\"",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@hrtech/types": "workspace:*",
    "next": "^15.1.3",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@hrtech/config": "workspace:*",
    "@types/node": "^22.10.2",
    "@types/react": "^19.0.2",
    "@types/react-dom": "^19.0.2",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.2",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: Create `apps/web/tsconfig.json`**

```json
{
  "extends": "@hrtech/config/typescript/nextjs.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create `apps/web/next.config.ts`**

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
};

export default nextConfig;
```

- [ ] **Step 4: Create `apps/web/tailwind.config.ts`**

```ts
import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;
```

The HR Tech color/type/spacing tokens from `docs/design-system.md` are added to `theme.extend` in the Design System plan — this stays minimal until then.

- [ ] **Step 5: Create `apps/web/postcss.config.mjs`**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 6: Create `apps/web/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['lib/**/*.test.ts', 'components/**/*.test.tsx'],
    environment: 'node',
  },
});
```

- [ ] **Step 7: Create `apps/web/.env.example`**

```
API_URL=http://localhost:3001
```

- [ ] **Step 8: Create `apps/web/app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 9: Write the failing test for the fetch helper**

`apps/web/lib/get-api-health.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getApiHealth } from './get-api-health';

describe('getApiHealth', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the parsed status when the API responds with a valid payload', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: () =>
          Promise.resolve({ status: 'ok', service: 'api', timestamp: '2026-01-01T00:00:00.000Z' }),
      }),
    );

    const result = await getApiHealth();

    expect(result.status).toBe('ok');
  });

  it('returns an error status when the request throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));

    const result = await getApiHealth();

    expect(result.status).toBe('error');
  });

  it('returns an error status when the payload is not a valid HealthStatus', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ unexpected: true }),
      }),
    );

    const result = await getApiHealth();

    expect(result.status).toBe('error');
  });
});
```

- [ ] **Step 10: Install and run the test to verify it fails**

Run: `pnpm install`

Run: `pnpm --filter @hrtech/web test`
Expected: FAIL — `Cannot find module './get-api-health'`

- [ ] **Step 11: Write the implementation**

`apps/web/lib/get-api-health.ts`:

```ts
import { isHealthStatus, type HealthStatus } from '@hrtech/types';

export async function getApiHealth(): Promise<HealthStatus> {
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001';

  try {
    const res = await fetch(`${apiUrl}/health/ready`, { cache: 'no-store' });
    const data: unknown = await res.json();
    return isHealthStatus(data) ? data : errorStatus();
  } catch {
    return errorStatus();
  }
}

function errorStatus(): HealthStatus {
  return { status: 'error', service: 'api', timestamp: new Date().toISOString() };
}
```

- [ ] **Step 12: Run the test to verify it passes**

Run: `pnpm --filter @hrtech/web test`
Expected: PASS — 3 tests passing

- [ ] **Step 13: Create the layout and placeholder page**

`apps/web/app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HR Tech',
  description: 'HR Tech — Desenvolvimento de Sistemas',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
```

`apps/web/app/page.tsx`:

```tsx
import { getApiHealth } from '@/lib/get-api-health';

export default async function Page() {
  const health = await getApiHealth();

  return (
    <main style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <h1>HR Tech — em construção</h1>
      <p>Status da API: {health.status}</p>
    </main>
  );
}
```

- [ ] **Step 14: Verify the build**

Run: `cp apps/web/.env.example apps/web/.env`

Run: `pnpm --filter @hrtech/web build`
Expected: PASS (the API doesn't need to be running for `next build` — the fetch happens at request time, not build time, since the page has no `generateStaticParams`/static export)

- [ ] **Step 15: Commit**

```bash
git add apps/web
git commit -m "feat(web): bootstrap Next.js skeleton wired to the API health endpoint"
```

---

### Task 8: Dockerfiles

**Files:**
- Create: `apps/api/Dockerfile`
- Create: `apps/api/.dockerignore`
- Create: `apps/web/Dockerfile`
- Create: `apps/web/.dockerignore`

**Interfaces:**
- Produces: buildable multi-stage images `hrtech-api` (port 3001) and `hrtech-web` (port 3000), using `turbo prune --docker` for layer-cached, workspace-aware builds — the same images the CI/deploy pipeline builds in `docs/adr/007-hosting-and-infra.md`.

- [ ] **Step 1: Create `apps/api/.dockerignore`**

```
node_modules
dist
.turbo
```

- [ ] **Step 2: Create `apps/api/Dockerfile`**

```dockerfile
FROM node:20-alpine AS base
RUN corepack enable

FROM base AS pruner
WORKDIR /app
RUN pnpm add -g turbo
COPY . .
RUN turbo prune @hrtech/api --docker

FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=installer /app/ .
COPY --from=pruner /app/out/full/ .
RUN pnpm --filter @hrtech/api prisma:generate
RUN pnpm turbo run build --filter=@hrtech/api

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S hrtech && adduser -S hrtech -G hrtech
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
USER hrtech
EXPOSE 3001
CMD ["node", "dist/main.js"]
```

- [ ] **Step 3: Create `apps/web/.dockerignore`**

```
node_modules
.next
.turbo
```

- [ ] **Step 4: Create `apps/web/Dockerfile`**

```dockerfile
FROM node:20-alpine AS base
RUN corepack enable

FROM base AS pruner
WORKDIR /app
RUN pnpm add -g turbo
COPY . .
RUN turbo prune @hrtech/web --docker

FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=installer /app/ .
COPY --from=pruner /app/out/full/ .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm turbo run build --filter=@hrtech/web

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup -S hrtech && adduser -S hrtech -G hrtech
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=hrtech:hrtech /app/apps/web/.next/standalone ./
COPY --from=builder --chown=hrtech:hrtech /app/apps/web/.next/static ./apps/web/.next/static
USER hrtech
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
```

- [ ] **Step 5: Verify both images build**

Requires Docker Desktop running.

Run (from repo root): `docker build -f apps/api/Dockerfile -t hrtech-api .`
Expected: builds successfully, ends with `naming to docker.io/library/hrtech-api`

Run: `docker build -f apps/web/Dockerfile -t hrtech-web .`
Expected: builds successfully

- [ ] **Step 6: Commit**

```bash
git add apps/api/Dockerfile apps/api/.dockerignore apps/web/Dockerfile apps/web/.dockerignore
git commit -m "chore: add multi-stage Dockerfiles for api and web via turbo prune"
```

---

### Task 9: CI pipeline

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Produces: a GitHub Actions workflow running `lint`, `typecheck`, `test`, `build` across the whole workspace on every push to `main` and every pull request. Deploy to Azure is **not** part of this task — it requires the user's Azure resources (Container Registry, Container Apps, Key Vault) to exist first, which is out of scope for this plan (see `docs/adr/007-hosting-and-infra.md`); it becomes its own task once those resources are provisioned.

- [ ] **Step 1: Create `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - name: Generate Prisma Client
        run: pnpm --filter @hrtech/api prisma:generate

      - run: pnpm turbo run lint typecheck test build
```

- [ ] **Step 2: Verify locally**

Run: `pnpm turbo run lint typecheck test build`
Expected: all tasks pass — this is exactly what CI runs, so a local pass means CI will pass too

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: run lint, typecheck, test and build on push and pull request"
```

---

### Task 10: End-to-end verification and README

**Files:**
- Create: `README.md`

**Interfaces:**
- Produces: a documented quickstart, and a manual confirmation that `apps/web` can reach `apps/api` through a real HTTP call — the milestone this whole plan exists to reach.

- [ ] **Step 1: Create root `README.md`**

```markdown
# HR Tech — Monorepo

Documentação completa em [`docs/`](./docs) — comece por [`docs/architecture.md`](./docs/architecture.md).

## Requisitos
- Node.js 20+
- pnpm 9+ (`corepack enable`)
- Docker (para Postgres local)

## Setup

\`\`\`bash
pnpm install
docker compose up -d postgres
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
pnpm --filter @hrtech/api prisma:generate
\`\`\`

## Desenvolvimento

\`\`\`bash
pnpm dev
\`\`\`

Sobe `apps/web` em http://localhost:3000 e `apps/api` em http://localhost:3001.

## Testes

\`\`\`bash
pnpm test
\`\`\`
```

- [ ] **Step 2: Run the full stack and verify the wiring end to end**

Run: `docker compose up -d postgres`

Run: `pnpm --filter @hrtech/api dev` (leave running in one terminal)

Run: `pnpm --filter @hrtech/web dev` (leave running in another terminal)

Open `http://localhost:3000` in a browser.
Expected: page shows "HR Tech — em construção" and "Status da API: ok"

Stop both dev servers (Ctrl+C).

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add root README with quickstart instructions"
```

---

## Self-Review Notes

- **Spec coverage:** every `docs/architecture.md` §2–§4 item for this stage (monorepo, Clean Architecture layering, module folder convention) has a task; §5 (multi-tenancy), §9 (feature flags), §10 (backup/DR), §11 (analytics) are explicitly out of scope for this plan per their documented triggers, and §6 (Core data model), most of §7 (front-end pages) belong to later plans. §8 (health checks) and §12 (security baseline) are fully implemented (Tasks 4–6). §13 (infra) is implemented up to the Docker/CI boundary — Azure deploy itself needs resources only the user can provision.
- **Type consistency:** `HealthStatus { status, service, timestamp }` is defined once in `packages/types` (Task 3) and reused verbatim by `PrismaService.isHealthy()` callers (Task 5/6) and `getApiHealth()` (Task 7) — no redefinition anywhere.
- **Naming consistency:** `PrismaService.isHealthy()` (Task 5) is the exact method name called in `GetReadinessUseCase` (Task 6); `buildHealthStatus(service, isHealthy, now?)` signature is identical between its definition (Task 6, Step 3) and both call sites (Task 6, Steps 7 and 9).
