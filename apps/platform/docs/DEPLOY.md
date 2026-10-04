# Deploy

A aplicação é um app Next.js padrão (Node.js 20+) + PostgreSQL. Não há acoplamento a um provedor específico.

## Checklist comum

1. Provisionar PostgreSQL 14+ (Azure Database for PostgreSQL Flexible Server, Neon, Supabase, RDS...).
2. Usuário do banco com permissão de criar papéis (CREATEROLE) para as migrations — elas criam o papel restrito
   `hrtech_rls`, usado em todas as transações para garantir o RLS. O usuário padrão dos bancos gerenciados
   (Neon, Azure, Supabase) normalmente já tem essa permissão. Em servidor próprio, por exemplo:
   ```sql
   CREATE ROLE hrtech LOGIN PASSWORD '...' CREATEDB CREATEROLE NOSUPERUSER NOBYPASSRLS;
   CREATE DATABASE hrtech OWNER hrtech;
   ```
   > Se o papel não puder ser criado, a migration emite um aviso e o RLS passa a depender do usuário de conexão
   > não ter SUPERUSER/BYPASSRLS — o painel `/admin` mostra o alerta.
3. Configurar as variáveis de ambiente (ver `.env.example`), no mínimo: `DATABASE_URL`, `APP_URL`,
   `AUTH_SECRET`, `ENCRYPTION_KEY`, `CRON_SECRET`.
4. Aplicar migrations: `pnpm prisma migrate deploy`.
5. Seed idempotente: `pnpm db:seed`. Em banco remoto ele exige `SEED_ADMIN_EMAIL` e `SEED_PASSWORD` no primeiro
   bootstrap (cria o Super Admin HR Tech e a organização HR Tech) e **não** cria dados fictícios, a menos que
   `SEED_DEMO=true`. Na Vercel isso já acontece no build de produção.
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

## Vercel (passo a passo)

O repositório já está preparado: `vercel.json` (build, instalação e cron), `scripts/vercel-build.sh`
(migrations + seed seguro + build) e detecção automática da URL do projeto.

### 1. Importar o projeto
1. Em vercel.com → **Add New… → Project** → importe o repositório `hrtech` (autorize o GitHub se pedido).
2. **Root Directory**: clique em *Edit* e selecione **`apps/platform`** (essencial — a raiz é o site institucional).
3. Framework: **Next.js** (detectado). Não altere Build/Install Command (vêm do `vercel.json`).
4. **Ainda não clique em Deploy**: primeiro crie o banco e as variáveis (passos 2 e 3). Se já clicou e o build
   falhou por falta de `DATABASE_URL`, tudo bem — siga os passos e faça *Redeploy*.

### 2. Banco de dados (Neon pela Vercel)
1. No projeto: **Storage → Create Database → Neon (Serverless Postgres)** → plano Free.
2. Região: escolha a **mesma região das funções** (São Paulo, se disponível; caso contrário, Washington/US East).
   Em **Settings → Functions → Function Region** use a região correspondente (ex.: `gru1` São Paulo, `iad1` Washington).
3. Conecte o banco ao projeto em todos os ambientes. A integração cria `DATABASE_URL` (com pooler) e
   `DATABASE_URL_UNPOOLED` (direta, usada para migrations).

> O usuário padrão do Neon pode ter privilégios que ignorariam o RLS. A aplicação trata isso: as migrations criam o
> papel restrito `hrtech_rls` e toda transação roda com ele. Confirme em `/admin` → card Integrações: "RLS ativo".

### 3. Variáveis de ambiente (Settings → Environment Variables, ambiente Production)

| Variável | Valor |
| --- | --- |
| `AUTH_SECRET` | texto aleatório ≥ 32 caracteres — `openssl rand -base64 48` |
| `ENCRYPTION_KEY` | 32 bytes em base64 — `openssl rand -base64 32` (guarde em local seguro; trocar invalida credenciais salvas) |
| `CRON_SECRET` | texto aleatório — `openssl rand -hex 32` |
| `SEED_ADMIN_EMAIL` | seu e-mail (vira o Super Admin HR Tech no primeiro deploy) |
| `SEED_ADMIN_NAME` | seu nome |
| `SEED_PASSWORD` | senha inicial forte (mín. 8, letras e números) — troque após o primeiro login |
| `SEED_DEMO` | `true` se quiser a "Pousada Exemplo" fictícia para demonstração (opcional) |

No Windows (PowerShell 7) gere valores aleatórios com:
`[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))`

Opcionais agora (podem ser adicionados depois, seguidos de *Redeploy*): `OPENAI_API_KEY`, `SMTP_*`, `META_*`,
`WHATSAPP_VERIFY_TOKEN`, `APP_URL` (só se usar domínio próprio).

### 4. Deploy
**Deployments → Redeploy** (ou *Deploy* na importação). O build mostra no log:
`→ Aplicando migrations` → `→ Seed …` → `✔ Seed concluído. Super Admin HR Tech: <seu e-mail>` → build do Next.js.

Acesse `https://<projeto>.vercel.app/login` com `SEED_ADMIN_EMAIL` / `SEED_PASSWORD`, troque a senha em
**Configurações → Minha conta** e confira `/admin`. Depois disso `SEED_PASSWORD` pode ser removida.

### 5. Rotina periódica
- O `vercel.json` agenda `/api/cron/tick` **1x por dia** (limite do plano Hobby; a Vercel envia o `CRON_SECRET`).
- Para follow-ups, sincronização de e-mail e reprocessamento de webhooks mais frequentes, crie um job gratuito
  (ex.: cron-job.org) a cada 10 minutos: `POST https://<projeto>.vercel.app/api/cron/tick` com o header
  `Authorization: Bearer <CRON_SECRET>`. No plano Pro, basta trocar o `schedule` no `vercel.json` para `*/10 * * * *`.

### Observações
- Deploys de **Preview** (branches/PRs) não aplicam migrations. Para usá-los com segurança, conecte um banco
  separado ao ambiente Preview (a integração Neon pode criar um *branch* do banco) e defina `MIGRATE_ON_BUILD=true` nele.
- Limite de requisições (rate limit) é por instância; com tráfego maior, use Redis (ver `docs/ARQUITETURA.md`).
- Webhooks da Meta: `https://<projeto>.vercel.app/api/webhooks/whatsapp` e `/api/webhooks/instagram`.

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
