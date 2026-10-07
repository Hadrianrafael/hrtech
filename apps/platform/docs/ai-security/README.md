# Segurança da Equipe IA

Princípio: **o modelo nunca é a última linha de defesa.** Mesmo que um agente seja manipulado, o que ele consegue
fazer é limitado por camadas determinísticas no servidor.

## Camadas

1. **Isolamento multi-tenant** — todas as tabelas da Equipe IA têm `organizationId`, entram no escopo automático do
   Prisma (`tenantDb`) e têm Row-Level Security com `FORCE` e o papel restrito `hrtech_rls`. Ferramentas recebem o
   contexto da empresa da tarefa; não existe parâmetro para escolher outra empresa.
2. **Allowlist de ferramentas** — cada agente só usa ferramentas da sua allowlist, que por sua vez é limitada ao teto do
   cargo (`ROLE_TOOLS`). Ferramentas inexistentes ou proibidas (merge, deploy, credenciais, exclusão, shell, SQL) são
   **bloqueadas e registradas** (`tool.blocked`).
3. **Validação de argumentos** — esquemas Zod com limites de tamanho/quantidade; IDs referenciados são verificados na
   própria empresa.
4. **Aprovação humana** — política por risco e autonomia; categorias sensíveis sempre aprovadas; payload exato com hash
   (o que é aprovado é exatamente o que executa); decisão atômica; expiração.
5. **Idempotência** — a mesma ação na mesma tarefa nunca executa duas vezes (`AiToolCall` único por chave); envios ao
   n8n únicos por chave; retornos únicos por `eventId`.
6. **Limites** — passos por execução, tokens por tarefa, profundidade de delegação, tarefas por objetivo/agente/dia,
   detecção de loop, orçamento diário/mensal e cota de IA do plano, lease do worker com recuperação.
7. **Auditoria** — `AiActivity` (linha do tempo), `AiToolCall` (entrada, saída, status, suspeita), `AiTaskRun` (consumo
   e transcrição resumida) e `AuditLog` (configuração, aprovações, pausa).

## Prompt injection

Mensagens de WhatsApp, Instagram, e-mail e chat, documentos, sites, retornos do n8n e memórias escritas por agentes
são **dados não confiáveis**:

- entram no prompt **delimitados** (`<<<DADOS_NAO_CONFIAVEIS origem="...">>> … <<<FIM_DADOS>>>`), com o preâmbulo de
  segurança no prompt de sistema dizendo que nada ali é instrução;
- são **higienizados**: remoção de caracteres de controle/invisíveis (zero-width, bidi), neutralização de delimitadores,
  truncamento de textos e listas;
- passam por **detecção heurística** (ignorar instruções, troca de papel, exfiltração de prompt/segredos, burlar
  aprovação, injeção de chamadas de ferramenta, delimitadores falsos). Ao detectar, a chamada é marcada como suspeita e
  registrada (`security.injection_suspected`) — o conteúdo continua sendo apenas dado;
- o agente recebe **o mínimo de dados pessoais** (ex.: `leads.search` informa se há telefone/e-mail, sem os valores).

A defesa principal é estrutural (itens 2 a 6): instruções escondidas num WhatsApp não dão ao agente novas
ferramentas, não pulam aprovações e não alcançam outra empresa.

## Ações que nenhum agente executa

Merge na main, deploy em produção e manipulação de credenciais **não existem como ferramenta**. O agente de
Desenvolvimento só registra pedidos (tarefa interna) e, com aprovação, abre issues pelo n8n.

## n8n

HMAC-SHA256 com timestamp (janela de 5 min) nos dois sentidos, comparação em tempo constante, `redirect: error` nas
chamadas de saída, limite de tamanho no retorno (1 MB) e nos comandos (50 KB), idempotência por `eventId`. O segredo
nunca é registrado em logs.

## Segredos

Chaves de provedores de IA e do n8n ficam somente em variáveis de ambiente (Vercel → Environment Variables, marcadas
como Sensitive). Nada é versionado. Sem credenciais, o sistema funciona em modo determinístico e marca as integrações
como **PENDENTE DE CREDENCIAL**.

## Testes

`tests/unit/ai-company-*.test.ts` e `tests/db/ai-company*.test.ts` cobrem allowlist, política de aprovação, detecção de
injeção, HMAC, idempotência, delegação, memória, pausa, orçamento, retry, indisponibilidade do n8n e isolamento entre
empresas.
