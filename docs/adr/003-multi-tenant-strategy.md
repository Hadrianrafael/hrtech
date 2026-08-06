# ADR 003 — Estratégia multi-tenant

## Status
Aceito

## Contexto
A HR Tech pretende vender múltiplos produtos SaaS para múltiplas empresas clientes. Decidir a estratégia de isolamento de dados entre clientes é uma decisão muito mais barata de tomar agora, no início, do que depois de o sistema estar em produção com dados reais.

## Alternativas consideradas
1. **Database-per-tenant** — isolamento máximo, mas custo de infraestrutura e complexidade operacional crescem linearmente com cada cliente novo. Inviável de operar sozinho nas fases iniciais.
2. **Schema-per-tenant** — isolamento forte, mas o Prisma tem suporte nativo limitado a múltiplos schemas dinâmicos, e migrações + queries cross-tenant (relatórios internos, por exemplo) ficam significativamente mais complexas.
3. **Banco compartilhado com coluna `tenantId`**, isolamento aplicado centralizadamente na camada de acesso a dados — padrão adotado por SaaS B2B como Linear e Vercel. Mais barato de operar, mais simples de manter sozinho, com o risco de vazamento de dados mitigado por não depender de nenhum desenvolvedor lembrar de filtrar manualmente.

## Decisão
Opção 3: **banco compartilhado + `tenantId`**, com isolamento centralizado via:

1. JWT carrega `tenantId`, `userId`, `roles`.
2. Middleware de contexto por requisição (`nestjs-cls` / `AsyncLocalStorage`) captura o `tenantId` e o disponibiliza sem precisar ser passado manualmente entre camadas.
3. **Prisma Client Extension** intercepta toda query de entidade com escopo de tenant e injeta `WHERE tenantId = :current AND deletedAt IS NULL` automaticamente — mesma extensão cobre multi-tenancy e soft delete.
4. `RolesGuard` aplica RBAC dentro do tenant já resolvido.

`Tenant` é modelado como entidade própria desde já — a HR Tech é o primeiro tenant, de uso interno — para que criar um novo tenant, quando o primeiro cliente SaaS for vendido, seja só inserir uma linha, não uma mudança de schema.

## Modelo de dados

Entidades do Core e seus relacionamentos (campos com `tenantId` são automaticamente escopados pela extensão do Prisma):

| Entidade | Campos-chave | Relacionamento |
|---|---|---|
| `Tenant` | id, name, slug (único), status, deletedAt | 1—N com as entidades abaixo |
| `User` | id, **tenantId**, email, passwordHash, status, deletedAt | N—1 Tenant · N—N Role |
| `Role` | id, **tenantId** (nulo = papel de sistema), name, isSystem | N—1 Tenant · N—N User · N—N Permission |
| `Permission` | id, key, description | N—N Role |
| `AuditLog` | id, **tenantId**, userId, action, entityType, entityId, metadata (json), createdAt | N—1 Tenant · N—1 User |
| `Plan` | id, key, name, priceCents, billingInterval | 1—N Subscription |
| `Subscription` | id, **tenantId**, planId, status, currentPeriodEnd, provider, providerRef | N—1 Tenant · N—1 Plan |
| `ApiKey` | id, **tenantId**, name, hashedKey, scopes, revokedAt | N—1 Tenant |
| `RefreshToken` | id, userId, tokenHash, expiresAt, revokedAt | N—1 User |
| `Notification` | id, **tenantId**, userId, type, payload, readAt | N—1 Tenant · N—1 User |

Schema Prisma dividido em múltiplos arquivos (`apps/api/prisma/schema/core/*.prisma`), usando o suporte nativo do Prisma a multi-file schema — cada módulo futuro adiciona um arquivo, sem editar os existentes.

## Consequências
- É estruturalmente impossível uma query esquecer o filtro de tenant, porque o filtro não depende de nenhum desenvolvedor escrever `WHERE tenantId = ...` manualmente em cada repositório.
- Uma única migração de banco para todo o sistema — operação mais simples que gerenciar N schemas ou N bancos.
- Testes automatizados da extensão do Prisma são obrigatórios e prioritários (ver `coding-standards.md`) — é a peça que garante isolamento entre todos os clientes futuros.
- Se um cliente futuro exigir contratualmente isolamento físico de banco (por compliance, por exemplo), essa decisão pode ser revisitada *para aquele tenant específico*, sem exigir mudança na estratégia para os demais.
