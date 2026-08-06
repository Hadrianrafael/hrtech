# Arquitetura — HR Tech

Este documento descreve a arquitetura técnica da plataforma HR Tech: o site institucional (primeiro "vertical" a rodar sobre a base) e o ecossistema de produtos SaaS que crescerá sobre a mesma infraestrutura.

Decisões individuais, com o raciocínio completo por trás de cada uma, estão registradas em [`docs/adr/`](./adr). Este documento é o mapa geral; os ADRs são o histórico de *por quê*.

## 1. Visão geral

A HR Tech não é só um site — é a base de um ecossistema de software (site institucional, portfólio, e futuramente múltiplos produtos SaaS verticais: construção civil, jurídico, logística, indústria, saúde, imobiliário, varejo, hotelaria, distribuição, serviços profissionais). A arquitetura é desenhada desde o primeiro commit para suportar esse crescimento sem exigir reescrita, mas sem construir infraestrutura para casos de uso que ainda não existem — ver [Princípio de escopo](#9-princípio-de-escopo-o-que-foi-adiado-de-propósito).

## 2. Monorepo

Gerenciado com **Turborepo + pnpm workspaces** (ver [ADR 002](./adr/002-monorepo-and-tooling.md)).

```
hrtech-site/
├── apps/
│   ├── web/                 # Next.js 15 (App Router) — front-end
│   └── api/                 # NestJS — back-end
├── packages/
│   ├── ui/                  # Design System (componentes React) — ver design-system.md
│   ├── config/               # tsconfig, eslint, tailwind config compartilhados
│   └── types/                 # Tipos/DTOs compartilhados entre web e api
├── docs/                       # esta documentação
├── docker-compose.yml           # Postgres local para desenvolvimento
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

`packages/ui` e `packages/config` são construídos **antes** de qualquer página — todas as páginas do site e, futuramente, todas as SaaS consomem a mesma base visual e de configuração.

## 3. Back-end — Clean Architecture

Cada módulo de domínio em `apps/api/src/modules/**` segue as mesmas quatro camadas (ver [ADR 004](./adr/004-clean-architecture-backend.md)):

```
modules/<nome>/
├── domain/          # entidades e regras de negócio puras — sem NestJS, sem Prisma
├── application/     # use cases (orquestram domain + repositórios via interface)
├── infrastructure/  # implementação dos repositórios (Prisma), estratégias externas
└── presentation/    # controllers, DTOs, validação de entrada
```

`domain/` nunca importa de `infrastructure/` nem de bibliotecas de framework. Isso é o que permite reaproveitar regras de negócio (ex: `auth`, `users`) quando o primeiro produto SaaS for criado, trocando só a camada de infraestrutura se necessário.

## 4. Arquitetura modular

Três camadas de módulos, cada uma com uma regra de dependência clara — módulos de camada inferior nunca dependem de camada superior (ver [ADR 005](./adr/005-module-boundaries.md)):

```
apps/api/src/modules/
├── core/                     # construído nesta etapa
│   ├── auth/                    # login, refresh token, JWT
│   ├── users/
│   ├── tenants/
│   ├── rbac/                     # Role, Permission
│   ├── audit/                     # AuditLog + interceptor
│   ├── notifications/
│   └── api-keys/
├── shared/                    # NÃO criado ainda — convenção documentada abaixo
├── website/                    # o site institucional da HR Tech — irmão de core, não um vertical de negócio
│   └── contact/                    # único módulo com back-end real nesta etapa
└── verticals/                   # futuros produtos SaaS — pastas vazias, sem código ainda
    ├── construction/  ├── legal/        ├── logistics/       ├── industry/
    ├── healthcare/    ├── real-estate/  ├── retail/          ├── hospitality/
    ├── distribution/  └── professional-services/
```

**Regra de extração para `shared/`:** um módulo só é movido para `shared/` quando o **segundo** consumidor real precisar da mesma capacidade (ex: "arquivos" usado por `construction` e depois por `legal`). Nunca é criado por antecipação. Quando isso acontecer, o módulo original em `verticals/<primeiro-consumidor>/` é generalizado e extraído; ambos os verticais passam a depender de `shared/<módulo>`.

No front-end (`apps/web/`), a mesma convenção de nomenclatura organiza as *features* (`website/{home,about,portfolio,contact,solutions,landing-pages}`), mantendo os dois lados espelhados.

## 5. Multi-tenancy

Estratégia: **banco compartilhado com `tenantId`**, isolamento aplicado centralizadamente — nunca depende do desenvolvedor lembrar de filtrar cada query (ver [ADR 003](./adr/003-multi-tenant-strategy.md)).

1. Todo JWT emitido carrega `tenantId`, `userId` e `roles`.
2. Um middleware de contexto (`nestjs-cls` / `AsyncLocalStorage`) captura o `tenantId` da requisição autenticada e o disponibiliza em toda a árvore de chamadas, sem precisar ser passado manualmente entre camadas.
3. Uma **Prisma Client Extension** intercepta toda query das entidades com escopo de tenant e injeta automaticamente `WHERE tenantId = :current AND deletedAt IS NULL` — a mesma extensão cobre isolamento multi-tenant **e** soft delete.
4. `RolesGuard` aplica RBAC (permissões) dentro do tenant já resolvido pelo contexto.

`Tenant` é modelado como entidade própria desde já (não só um campo solto) — a HR Tech é o primeiro tenant, de uso interno.

## 6. Modelo de dados — Core

Ver o ERD completo e a tabela de entidades em [ADR 003](./adr/003-multi-tenant-strategy.md#modelo-de-dados). Resumo das entidades do Core: `Tenant`, `User`, `Role`, `Permission`, `AuditLog`, `Plan`, `Subscription`, `ApiKey`, `RefreshToken`, `Notification`.

Schema Prisma organizado em múltiplos arquivos (`apps/api/prisma/schema/core/*.prisma`, `.../site/*.prisma`), usando o suporte nativo do Prisma a *multi-file schema* — cada módulo/vertical futuro adiciona seu próprio arquivo, sem tocar nos existentes.

Convenções transversais aplicadas a toda entidade de negócio:
- **Soft delete:** campo `deletedAt DateTime?`, filtrado automaticamente pela mesma Prisma Client Extension do isolamento multi-tenant.
- **Auditoria:** `AuditLog` genérico (`entityType`, `entityId`, `action`, `metadata` JSON), populado por um interceptor NestJS global — não exige instrumentação manual por service.

## 7. Front-end

- **Next.js 15 (App Router)**, **Server Components por padrão** — Client Components só onde há interatividade real (formulários, animações, R3F).
- **Tailwind CSS** configurado a partir dos tokens de `packages/config` (mesma fonte de verdade do Design System).
- **Framer Motion** para toda animação (ver `design-system.md` → Motion).
- **React Three Fiber** usado pontualmente (hero da home, páginas de solução) — nunca por padrão em toda página.
- **SEO:** metadata API do Next.js por página, sitemap e robots.txt gerados, Open Graph por página, dados estruturados (JSON-LD) nas páginas de solução.
- **i18n:** `next-intl` para strings de interface. Conteúdo dinâmico multi-idioma no banco só quando houver um caso de uso real (ver [Princípio de escopo](#9-princípio-de-escopo-o-que-foi-adiado-de-propósito)).

## 8. Observabilidade

Previsto desde já, implementado de forma mínima nesta etapa:

- **Logs estruturados:** JSON logging (`pino` via NestJS) desde o bootstrap — `console.log` nunca é usado em produção.
- **Health check:** endpoint `GET /health` na API, checando conexão com Postgres.
- **Readiness / liveness:** dois endpoints separados (`/health/live`, `/health/ready`) para o Azure Container Apps saber quando reiniciar vs. quando parar de rotear tráfego — implementados nesta etapa (são poucas linhas e o Container Apps já espera esse contrato).
- **Métricas e rastreamento de erros:** **documentados, não implementados agora** — a integração (ex: OpenTelemetry + um backend de observabilidade) entra quando o primeiro ambiente de produção real estiver recebendo tráfego de usuário. Gatilho explícito: primeiro deploy de produção com tráfego externo.

## 9. Feature Flags

Documentado como padrão, **não implementado nesta etapa** — não há usuário pagante ainda para segmentar.

Convenção quando for necessário: tabela `FeatureFlag` no Core (`key`, `description`, `enabledGlobally`) + tabela de override por tenant (`TenantFeatureFlag`). Nomenclatura em `kebab-case` descritivo do que a flag libera, não da equipe/projeto que a criou — exemplos de uso futuro: `new-dashboard`, `ai-experimental`, `beta-legal-module`, `construction-v2`.

**Gatilho para implementar:** quando a primeira feature precisar ser liberada para um subconjunto de tenants (early access, beta fechado) sem versionar o sistema inteiro.

## 10. Backup e Disaster Recovery

Documentado como política, dependente da configuração do Azure Database for PostgreSQL já provisionado:

- **Backup automático:** point-in-time restore nativo do Azure Database for PostgreSQL (confirmar retenção configurada — recomendado mínimo 7 dias em dev, 30 dias em produção).
- **Rollback de deploy:** Azure Container Apps mantém revisões anteriores — rollback é reativar a revisão anterior, sem rebuild.
- **Migrações do Prisma:** toda migração é aditiva sempre que possível (nunca `DROP COLUMN` no mesmo deploy que para de usar a coluna — remove em um deploy seguinte, já sem uso). Isso torna rollback de deploy seguro mesmo com o schema já migrado.

**Gatilho para formalizar um runbook completo de DR:** antes do primeiro tenant externo (cliente pagante) entrar em produção.

## 11. Analytics

Além do Google Analytics (pageviews padrão), eventos próprios via um único ponto de disparo no front-end (`trackEvent(name, payload)`, abstraído da ferramenta por trás — GA4 por padrão, trocável sem alterar os call sites). Eventos previstos desde o design, implementados quando a página correspondente existir:

- Clique em WhatsApp
- Solicitação de demonstração
- Envio do formulário de contato
- Visualização de cada landing page de solução
- Clique em cada card de solução no Hub

## 12. Segurança

Implementado no bootstrap da API desde esta etapa (configuração padrão, não feature):

- **Helmet** (headers de segurança padrão: `X-Content-Type-Options`, `X-Frame-Options`, etc.)
- **CORS** configurado explicitamente (origem do front-end, sem wildcard)
- **Rate limiting** (`@nestjs/throttler`) nos endpoints públicos, principalmente `POST /contact`
- **Validação e sanitização de entrada:** `class-validator` + `ValidationPipe` global, `whitelist: true` (rejeita campos não declarados no DTO)
- **CSP:** política conservadora (`default-src 'self'`, ajustada por diretiva conforme fontes externas reais forem usadas — ex: Google Fonts, GA)

Documentado, **não aplicável ainda**:
- **CSRF:** só é necessário se a autenticação migrar de JWT bearer para cookie de sessão. Gatilho explícito: adoção de auth por cookie.

Ver [ADR 008](./adr/008-security-baseline.md) para o raciocínio completo.

## 13. Infraestrutura e deploy

- **Dev local:** `docker-compose.yml` só sobe Postgres — `apps/web` e `apps/api` rodam nativamente (`pnpm dev`) para hot reload rápido.
- **CI:** GitHub Actions, um workflow, jobs paralelos via `turbo run lint test build` (cache incremental — só roda o que mudou).
- **Deploy:** GitHub Actions autentica no Azure via OIDC → builda `apps/web/Dockerfile` e `apps/api/Dockerfile` (multi-stage) → publica no Azure Container Registry → atualiza dois Azure Container Apps independentes. Migrações Prisma rodam como um `Job` do Container Apps antes do rollout da API.
- **Segredos:** Azure Key Vault, referenciado pelos Container Apps — nunca commitado, nunca em variável de ambiente em texto puro no workflow.
- **E-mail transacional:** Azure Communication Services, usado pelo módulo `website/contact` para notificar novo contato.

Ver [ADR 007](./adr/007-hosting-and-infra.md).

## 14. Testes

- **Vitest:** unit tests — prioridade máxima para `core/auth`, `core/tenants` (contexto de tenant) e a Prisma Client Extension de isolamento, porque é a parte que não pode falhar silenciosamente.
- **Playwright:** E2E do fluxo crítico (envio do formulário de contato, ponta a ponta).
- Cobertura de teste não é meta numérica nesta etapa.

## 15. Princípio de escopo — o que foi adiado de propósito

O Core é mantido enxuto de propósito. A tabela abaixo existe para que ninguém reintroduza, sem perceber, uma decisão já tomada:

| Adiado | Gatilho para implementar |
|---|---|
| Tabela genérica de versionamento/histórico | Quando um domínio específico precisar (ex: versões de contrato jurídico) — implementado só naquele domínio, não como infra genérica do Core |
| Tabela `Translation` (conteúdo multi-idioma no banco) | Quando o primeiro conteúdo dinâmico multi-idioma realmente existir |
| Módulos em `shared/` | Quando o segundo vertical precisar de uma capacidade que o primeiro já implementou |
| Métricas e rastreamento de erros (observabilidade) | Primeiro deploy de produção com tráfego externo |
| Feature Flags | Primeira feature que precisa ser liberada para um subconjunto de tenants |
| Runbook completo de Disaster Recovery | Antes do primeiro tenant externo (cliente pagante) |
| CSRF | Se/quando a autenticação migrar de JWT bearer para cookie de sessão |

Este documento — e o índice de ADRs — deve ser atualizado sempre que uma dessas linhas for implementada, movendo a decisão de "adiada" para um novo ADR.
