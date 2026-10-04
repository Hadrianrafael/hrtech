# HR Tech Omni — Plataforma SaaS omnichannel com IA

Plataforma B2B multiempresa da **HR Tech Sistemas** que centraliza **WhatsApp, Instagram, e-mail e chat do site**
com **CRM, funil comercial (Kanban), agenda, tarefas, follow-ups, automações, métricas e Inteligência Artificial**.
Foco inicial: hotéis, pousadas, hospedagens, turismo e pequenos negócios de serviços.

> A própria HR Tech é a primeira organização da plataforma (prospecção de hotéis e pousadas); depois, cada
> empresa cliente recebe seu ambiente isolado.

- Documentação de arquitetura: [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md)
- Integrações e o que depende de credenciais: [`docs/INTEGRACOES.md`](docs/INTEGRACOES.md)
- Segurança, multi-tenancy e LGPD: [`docs/SEGURANCA-LGPD.md`](docs/SEGURANCA-LGPD.md)
- Deploy (Azure / Vercel / Docker): [`docs/DEPLOY.md`](docs/DEPLOY.md)

## Stack

| Camada | Tecnologia |
| --- | --- |
| Full-stack | Next.js 15 (App Router, Server Components, Server Actions), React 19, TypeScript strict |
| UI | Tailwind CSS 3, componentes próprios acessíveis, tema claro/escuro, ícones lucide |
| Banco | PostgreSQL 16 + Prisma 6 (migrations versionadas) + **Row-Level Security** |
| Validação | Zod em todas as entradas (server actions, rotas públicas, webhooks) |
| IA | Camada de provedores (`AiProvider`) — OpenAI implementado; RAG por empresa |
| Canais | WhatsApp Cloud API (oficial), Instagram Messaging API (oficial), SMTP/IMAP, widget próprio |
| Billing | Interface `BillingProvider` — manual (ativo), Stripe e Asaas preparados |
| Testes | Vitest (unitários + integração com PostgreSQL real), Playwright (roteiro E2E manual) |

## Funcionalidades

- **Multiempresa** com isolamento no backend **e** no banco (RLS), papéis e permissões (RBAC) extensíveis.
- **Autenticação**: login, logout, sessão segura em banco, bloqueio por tentativas, recuperação/redefinição de senha,
  convite de usuários, troca de empresa, modo suporte auditado para a HR Tech. Estrutura pronta para login social.
- **Dashboard** com filtros (hoje, 7 dias, 30 dias, este mês, personalizado).
- **CRM**: leads/clientes com todos os campos pedidos, campos de hotelaria (check-in/out, hóspedes, acomodação),
  etiquetas, busca, filtros, exportação CSV, ficha completa com **timeline unificada**.
- **Kanban** com drag-and-drop (e menu "mover para" no celular), etapas/ordem/cores/regras/responsáveis configuráveis,
  múltiplos funis, histórico de movimentações.
- **Central de conversas** (3 painéis): lista por canal/status/responsável, chat, painel do contato editável,
  status de entrega, transferência para humano, janela de 24h do WhatsApp com envio de templates.
- **IA**: resposta automática, sugestão ao atendente (copiloto), resumo de conversa, intenção, qualificação e
  extração de dados para o CRM, recomendação de próxima ação e mensagem de follow-up. Métricas de uso e aceitação.
- **Base de conhecimento (RAG)** isolada por empresa, com teste de busca.
- **Chatbot configurável**: nome, saudação, tom, instruções, FAQ, horário, regras de transferência, campos a coletar,
  canais, modo Desligado/Copiloto/Automático, cores e domínios autorizados do widget.
- **Widget de chat e formulário de captura** para o site do cliente (um `<script>`).
- **Agenda** (dia/semana/mês), **tarefas** e **follow-ups** (manuais, por automação e por inatividade do lead).
- **Automações** por gatilho → condições → ações, com histórico de execuções e idempotência.
- **Métricas** calculadas apenas de dados reais (sem números inventados).
- **Painel HR Tech** (`/admin`): empresas, bloqueio, planos e limites, assinaturas, usuários, consumo, integrações,
  erros e auditoria.
- **LGPD**: consentimento, origem do dado, exportação (portabilidade), anonimização, exclusão e retenção automática.

## Instalação (desenvolvimento)

Requisitos: **Node.js 20+**, **pnpm 9** (`corepack enable`) e **PostgreSQL 14+**.

```bash
cd apps/platform
pnpm install
cp .env.example .env        # preencha DATABASE_URL, AUTH_SECRET, ENCRYPTION_KEY...
```

### Banco de dados

O usuário do banco usado pela aplicação **não pode ser SUPERUSER nem ter BYPASSRLS** — caso contrário o
Row-Level Security é ignorado (o painel `/admin` alerta quando isso acontece). Exemplo local:

```sql
CREATE ROLE hrtech LOGIN PASSWORD 'troque-esta-senha' CREATEDB NOSUPERUSER NOBYPASSRLS;
CREATE DATABASE hrtech OWNER hrtech;
CREATE DATABASE hrtech_test OWNER hrtech;   -- opcional, para os testes de integração
```

### Migrations e seed

```bash
pnpm db:migrate        # prisma migrate deploy (aplica as migrations versionadas em prisma/migrations)
pnpm db:seed           # planos, papéis, organização HR Tech e "Pousada Exemplo" com dados fictícios
pnpm db:migrate:dev    # durante o desenvolvimento, para criar novas migrations
```

Acessos de demonstração (senha padrão `Demo@12345`, configurável por `SEED_PASSWORD` — **troque após o primeiro acesso**):

| Perfil | E-mail |
| --- | --- |
| Super Admin HR Tech (painel `/admin` + organização HR Tech) | `admin@hrtech.example` |
| Administrador da Pousada Exemplo | `admin@pousadaexemplo.example` |
| Atendente da Pousada Exemplo | `atendente@pousadaexemplo.example` |

Todos os dados do seed são fictícios (domínios `.example`, nomes marcados como fictícios).

### Executar

```bash
pnpm dev            # http://localhost:3000
```

Sem SMTP configurado, links de convite e de redefinição de senha são exibidos na tela/console (apenas fora de produção).

## Verificações

```bash
pnpm lint           # ESLint
pnpm typecheck      # tsc --noEmit
pnpm test           # Vitest: unitários + integração (usa TEST_DATABASE_URL; sem banco, roda só os unitários)
pnpm build          # build de produção
pnpm check          # tudo acima em sequência
```

Os testes de integração validam, contra um PostgreSQL real com usuário não-superuser: isolamento entre empresas
(inclusive SQL bruto via RLS), autenticação/bloqueio/convites/redefinição, permissões por papel, CRM/funil/timeline,
automações (idempotência e falhas registradas), webhooks do WhatsApp (idempotência, empresa bloqueada, número
desconhecido), widget + IA (com provedor simulado), formulário do site, limites de plano e LGPD.

## Rotina periódica (cron)

`GET/POST /api/cron/tick` com `Authorization: Bearer $CRON_SECRET` — execute a cada 5–15 minutos. Ela:
gera follow-ups de leads sem resposta (48h), dispara o gatilho de tarefas atrasadas, sincroniza e-mails (IMAP),
reprocessa webhooks com falha, aplica retenção LGPD, marca testes expirados e limpa sessões vencidas.
Na Vercel, o `vercel.json` já agenda a rotina; no Azure use um Container Apps Job/Logic App (ver `docs/DEPLOY.md`).

## Estrutura

```
apps/platform
├── prisma/                 schema, migrations (init + rls) e seed
├── src/app/                rotas (App Router)
│   ├── (auth)/             login, recuperar/redefinir senha, aceitar convite
│   ├── (app)/              área da empresa (dashboard, inbox, CRM, funil, agenda, IA, equipe...)
│   ├── admin/              painel da plataforma HR Tech
│   ├── actions/            server actions (validação + autorização no servidor)
│   ├── api/                webhooks (Meta, billing), APIs públicas do widget/formulário, cron, health
│   └── widget.js/          script incorporável do chat/formulário
├── src/server/             regras de negócio (independentes do Next.js, testáveis)
│   ├── ai/                 provedores, agente, RAG
│   ├── channels/           WhatsApp, Instagram, e-mail, utilitários Meta
│   ├── automations/        motor, catálogo de ações, condições
│   └── billing/            planos/limites, provedores de pagamento, assinaturas
├── src/lib/                banco multi-tenant, auth, crypto, logs, auditoria, rate limit, validação
├── src/components/         UI
└── tests/                  unit/ e db/ (integração)
```

## Variáveis de ambiente

Todas documentadas em [`.env.example`](.env.example). Resumo:

| Variável | Obrigatória | Uso |
| --- | --- | --- |
| `DATABASE_URL` | sim | PostgreSQL (usuário sem SUPERUSER/BYPASSRLS) |
| `APP_URL` | sim | URL pública (links, webhooks, widget) |
| `AUTH_SECRET` | sim (produção) | HMAC dos tokens de sessão/convite/senha (≥ 32 caracteres) |
| `ENCRYPTION_KEY` | sim (produção) | AES-256-GCM das credenciais das integrações |
| `CRON_SECRET` | recomendado | Protege `/api/cron/tick` |
| `OPENAI_API_KEY` / `OPENAI_MODEL` | opcional | IA (sem ela, recursos de IA ficam desativados com aviso) |
| `META_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`, `INSTAGRAM_VERIFY_TOKEN` | p/ Meta | Webhooks oficiais |
| `SMTP_*`, `EMAIL_FROM` | recomendado | E-mails transacionais |
| `BILLING_PROVIDER`, `STRIPE_*`, `ASAAS_*` | opcional | Gateway de pagamento |

## Deploy

Resumo (detalhes em [`docs/DEPLOY.md`](docs/DEPLOY.md)):

- **Docker / Azure Container Apps**: `Dockerfile` multi-stage com saída `standalone` e target `migrate`.
- **Vercel**: projeto com raiz em `apps/platform`; `vercel.json` aplica migrations no build e agenda o cron.
- Em qualquer ambiente: rode `prisma migrate deploy` antes de subir a nova versão.
