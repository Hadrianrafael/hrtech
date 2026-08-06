# ADR 007 — Hospedagem em Azure Container Apps

## Status
Aceito

## Contexto
O projeto já usa Azure Database for PostgreSQL. Era preciso escolher onde `apps/web` e `apps/api` rodam em produção, entre as opções gerenciadas do Azure.

## Alternativas consideradas
1. **Azure App Service** — PaaS tradicional, um serviço por app, simples e bem documentado, porém menos flexível para configurações específicas de container e com um modelo de escala menos granular que Container Apps.
2. **Azure Container Apps** — roda `web` e `api` como containers independentes, escala cada um separadamente (o front-end pode escalar diferente do back-end sob carga distinta), bom custo-benefício, integração direta com Azure Container Registry e GitHub Actions via OIDC.

## Decisão
**Azure Container Apps**, com um app por serviço (`hrtech-web`, `hrtech-api`), cada um com seu próprio `Dockerfile` multi-stage.

Pipeline: GitHub Actions autentica no Azure via OIDC (sem secret de longa duração) → build das imagens → push para Azure Container Registry → atualização dos Container Apps. Migrações Prisma rodam como um `Job` do Container Apps antes do rollout da API — nunca `prisma migrate deploy` executado pelo próprio container da API subindo, para evitar condição de corrida entre múltiplas réplicas migrando ao mesmo tempo.

Segredos (connection string do Postgres, credencial do Azure Communication Services, JWT secret) ficam no Azure Key Vault, referenciados pelos Container Apps — nunca em variável de ambiente em texto puro no workflow ou no repositório.

## Consequências
- `web` e `api` escalam e fazem deploy de forma independente, mesmo vivendo no mesmo monorepo.
- Rollback de deploy é reativar a revisão anterior do Container App — sem rebuild, desde que a migração de banco daquele deploy tenha sido aditiva (ver `architecture.md` → Backup e Disaster Recovery).
- Exige manter dois `Dockerfile` multi-stage bem otimizados (build enxuto, imagem final pequena) — custo de manutenção aceito em troca da flexibilidade de container.
