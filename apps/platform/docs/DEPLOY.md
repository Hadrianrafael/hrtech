# Deploy

A aplicação é um app Next.js padrão (Node.js 20+) + PostgreSQL. Não há acoplamento a um provedor específico.

## Checklist comum

1. Provisionar PostgreSQL 14+ (Azure Database for PostgreSQL Flexible Server, Neon, Supabase, RDS...).
2. Criar o usuário da aplicação **sem SUPERUSER/BYPASSRLS** e um banco do qual ele seja dono:
   ```sql
   CREATE ROLE hrtech LOGIN PASSWORD '...' NOSUPERUSER NOBYPASSRLS;
   CREATE DATABASE hrtech OWNER hrtech;
   ```
   > Em serviços gerenciados, o usuário administrador costuma ter privilégios elevados — **não** use-o na aplicação.
3. Configurar as variáveis de ambiente (ver `.env.example`), no mínimo: `DATABASE_URL`, `APP_URL`,
   `AUTH_SECRET`, `ENCRYPTION_KEY`, `CRON_SECRET`.
4. Aplicar migrations: `pnpm prisma migrate deploy`.
5. (Primeira vez) Popular planos/papéis e a organização HR Tech: `pnpm db:seed` — depois **troque a senha** do
   usuário `admin@hrtech.example` ou crie seu usuário real e desative o de demonstração em `/admin/users`.
   Para um ambiente sem dados fictícios, remova a parte "Pousada Exemplo" do seed ou exclua a empresa depois.
6. Agendar a rotina `POST /api/cron/tick` (Bearer `CRON_SECRET`) a cada 5–15 minutos.
7. Configurar webhooks da Meta e do gateway de pagamento (ver `docs/INTEGRACOES.md`).
8. Verificar `GET /api/health` e o painel `/admin` (alerta de RLS e variáveis pendentes).

## Azure (recomendado: Container Apps)

```bash
# Build e push da imagem (a partir da raiz do repositório)
az acr build -r <seu-acr> -t hrtech-platform:latest apps/platform
az acr build -r <seu-acr> -t hrtech-platform-migrate:latest --target migrate apps/platform
```

1. **Container App** `hrtech-platform` com a imagem, porta 3000, ingress externo, variáveis/segredos (de
   preferência referenciando o Key Vault) e probe em `/api/health`.
2. **Container Apps Job** (manual ou disparado no pipeline) com a imagem `migrate` para `prisma migrate deploy`
   antes de cada nova revisão.
3. **Container Apps Job agendado** (cron `*/10 * * * *`) executando
   `curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://SEU_DOMINIO/api/cron/tick`
   (ou um Logic App / Azure Function com timer).
4. Domínio próprio + certificado gerenciado. Ative logs no Log Analytics/Application Insights.

O `Dockerfile` usa saída `standalone` do Next.js (imagem enxuta, usuário não-root, healthcheck).
Também é compatível com Azure App Service for Containers.

## Vercel

1. Importar o repositório e definir **Root Directory = `apps/platform`**.
2. Variáveis de ambiente no projeto (Production/Preview). Use um banco separado para Preview.
3. `vercel.json` já define `buildCommand` (aplica migrations antes do build) e o cron de 10 em 10 minutos
   (planos com cron frequente exigem conta Pro; no Hobby use um agendador externo).
4. Webhooks da Meta respondem rápido (o processamento roda com `after()`); para alto volume, considere fila.

## Docker local

```bash
docker build -t hrtech-platform apps/platform
docker run --rm --env-file apps/platform/.env -p 3000:3000 hrtech-platform
```

> O Dockerfile não pôde ser executado no ambiente em que esta versão foi desenvolvida (sem Docker); a saída
> `standalone` foi validada executando `node .next/standalone/server.js` diretamente.

## Atualizações

1. `pnpm check` (lint, tipos, testes, build) — o workflow **Platform CI** faz isso em todo PR.
2. Aplicar migrations no ambiente.
3. Publicar a nova versão. Migrations devem ser compatíveis com a versão anterior durante o rollout.
