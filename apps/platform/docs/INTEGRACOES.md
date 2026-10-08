# Integrações

Status de cada integração nesta primeira versão. **"Implementada"** significa que o código, telas, banco,
webhooks e variáveis de ambiente existem e foram testados com dados simulados; **nenhuma integração externa foi
validada contra o serviço real**, pois as credenciais ainda não foram fornecidas.

| Integração | Código | Depende de você |
| --- | --- | --- |
| Chat do site (widget) + formulário | ✅ Funcionando ponta a ponta | Nada (só colar o script no site) |
| WhatsApp Business Platform (Cloud API) | ✅ Implementada | App Meta, número aprovado, tokens, configuração do webhook |
| Instagram Messaging API | ✅ Implementada | App Meta aprovado para mensagens, conta profissional, token |
| E-mail (SMTP + IMAP) | ✅ Implementada | Servidor/conta de e-mail e senha de app |
| E-mail transacional (convites/senhas) | ✅ Implementada | Servidor SMTP |
| IA (OpenAI / Anthropic / Gemini) | ✅ Implementada | ao menos uma chave: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` ou `GEMINI_API_KEY` — **PENDENTE DE CREDENCIAL** |
| Equipe IA (CEO Agent + agentes) | ✅ Funcionando (modo determinístico sem IA) | chave de IA para planejamento livre; agendar `/api/cron/ai` |
| n8n (ações externas da Equipe IA) | ✅ Implementada + fluxos importáveis | instância n8n, `N8N_BASE_URL`, `N8N_WEBHOOK_SECRET` — **PENDENTE DE CREDENCIAL** |
| Billing manual | ✅ Funcionando | — |
| Stripe | 🟡 Checkout + webhook implementados, não testados | Conta Stripe, chaves e webhook |
| Asaas | 🟡 Webhook implementado; criação de assinatura pendente | Conta Asaas e chave de API |
| Login social (Google/Microsoft) | ⏳ Apenas modelo de dados (`AuthAccount`) | Apps OAuth |

## WhatsApp Business Platform (Cloud API oficial)

Somente a API oficial da Meta é usada — nenhuma biblioteca não oficial, automação de WhatsApp Web ou scraping.

**Pré-requisitos (Meta)**
1. Conta no Meta Business (verificada para produção).
2. App em developers.facebook.com com o produto **WhatsApp**.
3. Número de telefone adicionado à WhatsApp Business Account (WABA).
4. **System User** com permissões `whatsapp_business_messaging` e `whatsapp_business_management` e um token
   permanente.

**Configuração na plataforma**
1. Variáveis globais: `META_APP_SECRET` (App Secret do app) e `WHATSAPP_VERIFY_TOKEN` (texto aleatório que você
   define). Opcional: `META_GRAPH_VERSION`.
2. No painel da Meta → WhatsApp → Configuração → Webhook:
   - URL de callback: `https://SEU_DOMINIO/api/webhooks/whatsapp`
   - Token de verificação: o valor de `WHATSAPP_VERIFY_TOKEN`
   - Assinar o campo **messages**.
3. Na plataforma (empresa) → **Integrações → WhatsApp → Conectar**: informe Phone Number ID, WABA ID e o token.
   O token é cifrado (AES-256-GCM) e nunca mais exibido. Clique em **Testar conexão**.
4. **Verificação de posse:** a integração só passa a receber mensagens depois do **Testar conexão**, que confirma
   com o token informado que o Phone Number ID existe e pertence à WABA. Até lá ela fica "pendente" e os webhooks
   desse número são ignorados — assim uma empresa não consegue "reservar" o número de outra.

**Como funciona**
- Um único app Meta atende todas as empresas: o `phone_number_id` do webhook identifica a empresa. O mesmo número
  não pode ser cadastrado em duas empresas.
- Recebidos: texto, botões/listas, localização e mídias (imagem, áudio, vídeo, documento, figurinha). Mídias são
  baixadas sob demanda pelo proxy autenticado `/api/app/media/:id` (a URL da Meta exige token).
- Status de entrega (enviada/entregue/lida/falhou) atualizam a mensagem; falhas são auditadas.
- **Janela de 24h**: fora dela a plataforma bloqueia texto livre e oferece envio de **template aprovado** (nome,
  idioma, parâmetros). O cadastro/aprovação de templates é feito no WhatsApp Manager.

**Pendências / próxima versão**: envio de mídia pela equipe, sincronização automática da lista de templates
aprovados (`MessageTemplate` já modelado), Embedded Signup para clientes conectarem o próprio número sem suporte.

## Instagram (API oficial)

Disponível para **contas profissionais** elegíveis, com app aprovado no App Review para
`instagram_business_manage_messages` (Instagram API com login do Instagram) ou via Página do Facebook.

1. Variáveis: `META_APP_SECRET`, `INSTAGRAM_VERIFY_TOKEN` (ou reutiliza o do WhatsApp) e, para a **Instagram API
   com login do Instagram**, `INSTAGRAM_APP_SECRET` (o "Instagram App Secret" exibido em Instagram → Configuração da
   API; é ele que assina os webhooks desse produto). A assinatura é aceita com qualquer um dos dois segredos.
2. Webhook no painel da Meta: `https://SEU_DOMINIO/api/webhooks/instagram`, campo **messages**.
3. Na plataforma → **Integrações → Instagram**: ID da conta profissional, tipo de login da API e token.
4. **Testar conexão** confirma com o token que ele pertence à conta informada; só então a integração recebe
   mensagens. Anexos recebidos (imagens, vídeos, áudios) abrem pelo proxy autenticado, que só redireciona para CDNs
   da Meta.

Limites respeitados: resposta apenas dentro de 24h após a última mensagem do cliente; ecos e mensagens apagadas são
ignorados. Comentários de posts não fazem parte desta versão.

## E-mail da empresa (SMTP + IMAP)

- Envio por SMTP com cabeçalhos `In-Reply-To`/`References` (as respostas ficam na mesma thread do cliente).
- Recebimento por IMAP (INBOX, mensagens novas por UID) a cada execução do cron ou no botão **Sincronizar agora**.
  Threads são agrupadas pelo `Message-ID`; o texto citado das respostas é removido.
- Gmail/Microsoft 365: use **senha de app** (com verificação em duas etapas). OAuth2 (XOAUTH2) é a evolução
  recomendada — exige registrar apps no Google Cloud/Microsoft Entra.
- A senha é cifrada no banco.

## Chat do site e formulário

Em **Chatbot e IA → Instalação no site**:

```html
<script src="https://SEU_DOMINIO/widget.js" data-key="pk_..." async></script>
```

- O widget identifica a empresa pela chave pública, coleta nome/telefone/e-mail e consentimento LGPD, cria o lead
  no CRM, conversa com a IA (modo automático) ou com a equipe (copiloto/desligado), e permite "Falar com atendente".
- Formulário: qualquer `<form data-hrtech-form="pk_...">` com o mesmo script envia os campos (`name`, `email`,
  `phone`, `message`, `interest`, `service`, `budget`, `desiredDate`, `checkIn`, `checkOut`, `guests`, `roomType`,
  `consent`, `wantsAppointment`) para o CRM. Também é possível enviar via `POST /api/public/leads/{chave}`.
- Restrinja os domínios autorizados na configuração do chatbot. Há rate limit por IP e honeypot anti-spam.
- Demonstração: `/embed-demo?key=pk_...`.

## IA (OpenAI, Anthropic, Gemini)

- Provedores: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` (Claude, padrão `claude-opus-5-5`), `GEMINI_API_KEY`
  (ou `GOOGLE_API_KEY`). `AI_PROVIDER` escolhe o padrão; cada agente da Equipe IA pode usar outro provedor/modelo.
  Embeddings (RAG) usam a OpenAI.

- `OPENAI_API_KEY` (e opcionalmente `OPENAI_MODEL`, `OPENAI_EMBEDDING_MODEL`, `OPENAI_BASE_URL`).
- Sem a chave, a plataforma funciona normalmente e exibe "IA pendente de credencial" nas telas de IA.
- Após configurar, use **Base de conhecimento → Reindexar** para gerar embeddings dos documentos existentes.
- Custos: cada chamada é registrada em `AiRun` (tokens, latência) e limitada pelo plano (`aiMessagesPerMonth`).

## Pagamentos

`BILLING_PROVIDER=manual` (padrão): o Super Admin altera plano e status no painel; o cliente solicita mudança de
plano e a solicitação fica auditada.

- **Stripe**: `BILLING_PROVIDER=stripe`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`; webhook em
  `https://SEU_DOMINIO/api/webhooks/billing/stripe` (eventos `checkout.session.completed`, `invoice.paid`,
  `invoice.payment_failed`, `customer.subscription.deleted`). Checkout usa o preço configurado no plano.
- **Asaas**: `BILLING_PROVIDER=asaas`, `ASAAS_API_KEY`, `ASAAS_WEBHOOK_TOKEN`; webhook em
  `/api/webhooks/billing/asaas` (header `asaas-access-token`). Falta implementar a criação de cliente/assinatura
  na API do Asaas (`createCheckout`) quando a conta estiver disponível.

## Equipe IA e n8n

Ver [`docs/agents`](agents/README.md), [`docs/n8n`](n8n/README.md) e [`docs/ai-security`](ai-security/README.md).
Sem n8n configurado, as ações externas ficam na fila como **PENDENTE DE CREDENCIAL** e são enviadas quando o n8n
for configurado.

## Rotina periódica

Configure um agendador chamando `POST https://SEU_DOMINIO/api/cron/tick` com
`Authorization: Bearer $CRON_SECRET` a cada 5–15 minutos (Vercel Cron já configurado em `vercel.json`).
Para a Equipe IA, agende também `POST https://SEU_DOMINIO/api/cron/ai` a cada 1–5 minutos (ex.: fluxo
`n8n/workflows/agendador-worker.json`).
