# Arquitetura

## Visão geral

```
            Site do cliente ──► widget.js / formulário ──► /api/public/* (CORS, rate limit, chave pública)
WhatsApp Cloud API ─┐
Instagram API ──────┼──► /api/webhooks/* (assinatura HMAC, idempotência) ──┐
E-mail (IMAP) ──────┘        /api/cron/tick (sincronização IMAP)            │
                                                                            ▼
Navegador (equipe) ──► Server Components / Server Actions ──► src/server/* (regras de negócio)
                                                                            │
                                     tenantDb(orgId) / systemDb / withTenant│
                                                                            ▼
                                                        PostgreSQL + Row-Level Security
                                                                            │
                                         Provedores externos: IA (OpenAI), SMTP, Meta Graph, gateways de pagamento
```

**Decisão**: monólito modular em Next.js (App Router). Um único deploy atende UI, APIs públicas, webhooks e cron,
o que reduz custo operacional na fase inicial. As regras de negócio vivem em `src/server/*` e **não dependem do
Next.js** (recebem um `ServiceCtx`), por isso podem ser reutilizadas por uma API pública, workers de fila, um app
mobile ou extraídas para serviços no futuro.

**Decisão**: o projeto fica em `apps/platform`, independente do site institucional (exportação estática no GitHub
Pages) que ocupa a raiz do repositório. Cada um tem seu `package.json`/lockfile e seu workflow de CI.

## Multi-tenancy

Modelo **banco compartilhado, esquema compartilhado** com coluna `organizationId` em todas as tabelas de dados de
cliente, protegido em duas camadas independentes:

1. **Aplicação** — `tenantDb(orgId)` (`src/lib/db.ts`) é uma extensão do Prisma que injeta
   `organizationId = orgId` em toda leitura/atualização/exclusão, força o `organizationId` na criação e bloqueia
   tentativas de gravar/mover registros para outra organização.
2. **Banco** — migration `20261004012600_rls` habilita `ROW LEVEL SECURITY` + `FORCE` em todas as tabelas de tenant.
   Cada operação roda numa transação que define `app.org_id`; sem esse contexto o banco não retorna linhas
   (*fail-closed*). Operações de sistema (login, roteamento de webhooks, cron, painel HR Tech) usam `systemDb`, que
   define `app.bypass_rls = on` explicitamente.

A organização ativa vem **sempre da sessão no servidor** (ou, em webhooks, do identificador do canal cadastrado),
nunca de parâmetro enviado pelo navegador. Testes de integração comprovam o isolamento inclusive com SQL bruto.

Escopo adicional por usuário: sem a permissão `records.view_all`, atendentes enxergam apenas contatos,
oportunidades, conversas, tarefas e compromissos atribuídos a eles ou ainda sem responsável (`ownerScope`).

## Autenticação e autorização

- Sessões opacas (token aleatório de 256 bits em cookie `httpOnly`, `SameSite=Lax`, `Secure` em produção);
  no banco fica apenas o HMAC do token (`AUTH_SECRET`). Renovação deslizante (14 dias) e revogação no logout,
  na redefinição de senha e ao desativar usuário.
- Senhas com bcrypt (custo 12), política mínima, bloqueio de 15 min após 5 falhas, rate limit por IP e por e-mail.
- Convites e redefinição de senha com tokens de uso único e expiração.
- `AuthAccount` já modelado para login social (Google/Microsoft) futuramente.
- **RBAC**: catálogo de permissões em `src/lib/auth/permissions.ts`; papéis de sistema (Administrador, Gestor,
  Atendente/Vendedor) + papéis personalizados por empresa (tela Equipe). Toda server action/rota chama
  `requireActionContext(permissão)` / `routeContext(permissão)`; os serviços repetem `assertCan`.
- **Super Admin HR Tech**: flag `User.isPlatformAdmin`; acessa `/admin` e pode entrar em uma empresa em
  "modo suporte" (banner visível + auditoria).

## Modelo de dados (principais entidades)

| Domínio | Entidades |
| --- | --- |
| Plataforma | `Organization`, `User`, `Session`, `PasswordReset`, `AuthAccount`, `Membership`, `Role` (permissões), `Invitation` |
| Billing | `Plan` (preço e limites configuráveis), `Subscription`, `Usage` (consumo mensal) |
| CRM | `Contact` (lead/cliente + `customFields` por segmento), `ContactIdentity`, `Tag`, `Note`, `Pipeline`, `PipelineStage`, `Opportunity`, `TimelineEvent` |
| Omnichannel | `Integration` (credenciais cifradas), `EmailAccount`, `MessageTemplate`, `Conversation`, `Message`, `WebhookEvent` |
| IA | `Chatbot`, `KnowledgeBase`, `KnowledgeDocument`, `KnowledgeChunk` (embeddings), `AiRun` |
| Operação | `Appointment`, `Task`, `Automation`, `AutomationRun`, `AuditLog` |

"Lead" é um `Contact` com `kind = LEAD`; o negócio em andamento é a `Opportunity` (card do Kanban). A timeline
combina `TimelineEvent` com as mensagens de todos os canais.

## Fluxo de uma mensagem recebida

1. Webhook valida a assinatura (`X-Hub-Signature-256`), grava cada mensagem em `WebhookEvent` com chave única
   (idempotência) e responde 200 imediatamente; o processamento roda em seguida (`after()`).
2. O número/conta de destino identifica a `Integration` → empresa. Empresas bloqueadas são ignoradas.
3. `receiveInbound` localiza/cria o contato (`ContactIdentity`, casando por telefone/e-mail), a conversa e a
   mensagem; atualiza status do lead; dispara `message.received` para as automações.
4. `handleAi` decide: regras determinísticas de transferência (palavras-chave, limite de respostas) → modo
   Copiloto (nada automático) ou Automático (gera resposta com RAG, aplica dados extraídos ao CRM, registra intenção,
   transfere para humano quando indicado). Toda chamada vira um `AiRun` e consome a cota do plano.
5. Falhas ficam em `WebhookEvent.status = FAILED` e são reprocessadas pelo cron (até 3 tentativas).

## IA

- `AiProvider` (`src/server/ai/provider.ts`): `chat()` e `embed()`. Implementado: OpenAI (Chat Completions +
  Embeddings, com retry exponencial em 429/5xx e timeout). Para trocar/adicionar provedor (Azure OpenAI, Anthropic,
  Gemini...), implemente a interface e registre em `getAiProvider()`.
- Saída estruturada em JSON (resposta, intenção, transferência, dados extraídos) validada com Zod; se o modelo
  responder texto livre, o sistema degrada para resposta simples.
- O prompt instrui a **não inventar** preços/condições e a usar apenas a base de conhecimento e o FAQ da empresa.
- **RAG**: documentos são divididos em trechos com sobreposição; com provedor de embeddings, a busca combina
  similaridade de cosseno (80%) e palavras-chave (20%); sem embeddings, usa só palavras-chave. Os vetores ficam em
  `Float[]` — migrar para `pgvector` exige trocar a coluna e a consulta em `retrieve()` quando o volume crescer.

## Automações

`emitEvent(ctx, gatilho, payload, { eventKey })` → `runAutomations`. Cada execução cria um `AutomationRun` com
chave única (automação + evento), o que torna reentregas idempotentes. Condições são avaliadas sobre "fatos"
(contato, oportunidade, conversa, intenção) e as ações executam em sequência; falhas ficam registradas como
`FAILED`/`PARTIAL` e auditadas. Proteção contra loops por profundidade máxima. Novos gatilhos/ações: adicione em
`TRIGGERS` (`src/server/events.ts`) e `ACTIONS` + `executeAction` (`src/server/automations/*`); o editor visual
é gerado a partir do catálogo.

## Billing desacoplado

`BillingProvider` (`src/server/billing/provider.ts`) isola gateways. O restante da aplicação só conhece `Plan`,
`Subscription`, `Usage` e `assertWithinLimit()`. Limites aplicados: usuários (inclui convites pendentes), contatos,
automações, canais, documentos de conhecimento e mensagens de IA/mês. Preços e limites são editados no painel
(`/admin/plans`) — nada fixo no código (o seed apenas cria valores iniciais).

## Preparação para crescimento

- **API pública / app mobile**: os serviços em `src/server` já recebem `ServiceCtx`; basta expor rotas com
  autenticação por token de API (modelo `ApiKey` a criar) reutilizando-os.
- **Filas**: webhooks já separam "gravar" de "processar"; trocar `after()` por uma fila (Azure Service Bus,
  BullMQ, Inngest) não muda o domínio.
- **Rate limit distribuído**: `setRateLimitStore()` aceita um store compartilhado (Redis/Upstash).
- **Novos canais**: implementar parser de webhook + envio em `src/server/channels/*` e adicionar ao enum `Channel`.
- **White-label**: cores e nome do widget já são por empresa; tema da aplicação usa variáveis CSS.
- **Integrações com CRMs/reservas**: gatilhos de automação + ação "webhook externo" (próxima versão).
