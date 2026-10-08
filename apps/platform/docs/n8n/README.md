# Integração com o n8n

O n8n é um **serviço externo** usado pela Equipe IA para ações fora da SaaS (buscar prospects, sequências de contato,
publicar, abrir issues, cobranças, enviar o briefing) e como **agendador** do worker. Status atual:
**PENDENTE DE CREDENCIAL** até definir as variáveis abaixo — sem elas, os envios ficam na fila e saem sozinhos
quando forem configuradas.

## Quem habilita

Os fluxos importáveis usam as credenciais de canais configuradas na instância do n8n (WhatsApp, e-mail, Google
Places). Por isso a integração é **habilitada pela equipe HR Tech**: a própria HR Tech (organização dona da
plataforma) liga em Equipe IA → Configurações; para uma empresa cliente, um administrador da plataforma liga depois
de configurar fluxos e credenciais **dessa empresa** no n8n. Sem a integração habilitada, as ferramentas `n8n.*` ficam
indisponíveis para os agentes. Com a Equipe IA pausada ou desativada, ou com a empresa inativa, os envios já
enfileirados ficam **retidos** (não saem) até a situação voltar ao normal.

## Variáveis

Na SaaS (Vercel / `.env`):

| Variável | Descrição |
| --- | --- |
| `N8N_BASE_URL` | URL do n8n, ex.: `https://n8n.seudominio.com.br` |
| `N8N_WEBHOOK_SECRET` | segredo compartilhado (HMAC-SHA256) — `openssl rand -hex 32` |
| `N8N_API_KEY` | opcional (API REST do n8n) |
| `N8N_TIMEOUT_MS` | opcional (padrão 15000) |
| `CRON_SECRET` | usado pelo agendador do n8n para chamar `/api/cron/ai` |

No n8n (Settings → Variables ou variáveis de ambiente do container):

| Variável | Descrição |
| --- | --- |
| `HRTECH_WEBHOOK_SECRET` | o mesmo valor de `N8N_WEBHOOK_SECRET` |
| `HRTECH_APP_URL` | URL pública da SaaS (ex.: `https://app.hrtechsistemas.com.br`) |
| `HRTECH_CRON_SECRET` | o mesmo valor de `CRON_SECRET` |
| `N8N_INTERNAL_BASE_URL` | URL interna do próprio n8n para o dispatcher chamar os subfluxos (padrão `http://localhost:5678`) |
| `GOOGLE_PLACES_API_KEY` | prospecção (Google Places API — fonte oficial) |
| `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_TEMPLATE_FOLLOWUP` | sequências por WhatsApp (Cloud API oficial, template aprovado) |
| `HRTECH_EMAIL_FROM` + credencial SMTP no n8n | e-mails (sequências e briefing) |

Para o nó Code verificar/assinar HMAC, o n8n precisa de `NODE_FUNCTION_ALLOW_BUILTIN=crypto` e acesso a variáveis
(`N8N_BLOCK_ENV_ACCESS_IN_NODE=false`).

## Fluxos importáveis (`n8n/workflows/`)

| Arquivo | Webhook | Função |
| --- | --- | --- |
| `dispatcher.json` | `/webhook/hrtech-dispatcher` | entrada única: verifica a assinatura, responde 202 e encaminha pelo campo `workflow` |
| `prospeccao.json` | `/webhook/hrtech-prospeccao` | Google Places Text Search → prospects normalizados → retorno assinado |
| `comercial.json` | `/webhook/hrtech-comercial` | WhatsApp (template) ou e-mail por contato → resumo → retorno |
| `briefing.json` | `/webhook/hrtech-briefing` | envia o briefing por e-mail aos destinatários → retorno |
| `agendador-worker.json` | — | a cada 2 min chama `POST /api/cron/ai` com o `CRON_SECRET` |

Todos os fluxos com webhook verificam a assinatura e **deduplicam pela `idempotencyKey`** (chaves vistas nos últimos
7 dias respondem `200 {"duplicate": true}` sem repetir a ação), porque a SaaS reenvia o mesmo envio quando não sabe se
ele chegou (timeout, 5xx, queda). A deduplicação usa os dados estáticos do fluxo, que valem para fluxos **ativos** em
uma instância; em n8n com várias instâncias/fila, troque por uma tabela Postgres ou Redis. Fluxos próprios que
recebam envios da HR Tech **devem** deduplicar da mesma forma.

Importe em **Workflows → Import from file**, configure as credenciais (SMTP) e ative. Os fluxos de marketing,
desenvolvimento e financeiro chegam ao dispatcher (saídas já roteadas); crie os subfluxos `hrtech-marketing`,
`hrtech-desenvolvimento` e `hrtech-financeiro` conforme as ferramentas que a empresa usar (ex.: GitHub Issues, Asaas)
seguindo o mesmo padrão de retorno. Caminhos personalizados por fluxo aceitam apenas `/webhook/<nome>` (sem `..`
nem outro host). Para regenerar os JSONs: `python3 n8n/generate-workflows.py`.

## Contrato

### SaaS → n8n

`POST <N8N_BASE_URL>/webhook/hrtech-dispatcher` (ou o caminho configurado por fluxo em Equipe IA → Configurações)

Cabeçalhos: `X-HRTech-Signature: t=<unix>,v1=<hex>`, `X-HRTech-Idempotency-Key`, `X-HRTech-Workflow`.
A assinatura é `HMAC_SHA256(N8N_WEBHOOK_SECRET, "<t>.<corpo bruto>")`; rejeite se `|agora − t| > 300 s`.

```json
{
  "id": "<dispatchId>",
  "idempotencyKey": "<chave estável — a mesma ação nunca gera dois envios>",
  "workflow": "prospeccao | comercial | briefing | marketing | desenvolvimento | financeiro",
  "organizationId": "<empresa>",
  "taskId": "<tarefa do agente>",
  "callbackUrl": "https://<app>/api/webhooks/n8n",
  "sentAt": "2026-10-07T12:00:00.000Z",
  "attempt": 1,
  "data": { "...": "parâmetros da ferramenta" }
}
```

Respostas: `2xx` = aceito (o resultado vem pelo callback; um fluxo síncrono pode responder
`{"status":"completed","result":{...}}`). `5xx`, `408`, `429` ou falha de rede = nova tentativa com backoff
(1 min, 5 min, 15 min, 1 h, 3 h, 6 h; até 8 tentativas → `DEAD`). Outros `4xx` = falha permanente.
Envios `SENT` sem retorno em 24 h são marcados como falha. Reenvio manual em Equipe IA → Configurações.

### n8n → SaaS (retorno)

`POST /api/webhooks/n8n` com o mesmo esquema de assinatura sobre o corpo exato enviado:

```json
{ "eventId": "<id único e estável do evento>", "dispatchId": "<id>", "idempotencyKey": "<opcional>",
  "status": "completed | failed | progress", "result": { "prospects": [ ... ] }, "error": "<se failed>" }
```

Idempotente pelo `eventId` (reentregas não duplicam). O resultado é tratado como **dado não confiável** (higienizado e
delimitado antes de chegar a qualquer modelo). Limite de 1 MB.

### n8n → SaaS (comandos ao CEO)

`POST /api/n8n/commands` (mesma assinatura): `{ "eventId": "...", "organizationId": "...", "command": "Quero 5 clientes este mês", "requestedByEmail": "dono@empresa.com" }`.
Exige Equipe IA e n8n ativados na empresa; o e-mail só é associado se for membro com permissão `ai_team.command`.

## Indisponibilidade

Depois do envio, a SaaS só altera o registro se ele ainda estiver em envio: um retorno que chegue durante a chamada
prevalece e nada é reenviado. Se o n8n cair, as tarefas ficam aguardando (status `RUNNING`, "aguardando n8n") e os envios seguem na fila com novas
tentativas; nada é perdido nem duplicado (idempotência por chave e por `eventId`). Sem credenciais, o envio fica
`PENDING` com a mensagem "PENDENTE DE CREDENCIAL" e é reavaliado a cada 15 minutos.
