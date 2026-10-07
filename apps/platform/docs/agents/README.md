# Equipe IA (HR Tech AI Company)

Módulo da HR Tech Omni em que uma **equipe de agentes de IA** trabalha para a empresa, coordenada por um
**CEO Agent**. A própria HR Tech é a primeira empresa usuária (o seed ativa a Equipe IA da organização dona da
plataforma). Qualquer empresa cliente pode ativar a sua em **Equipe IA → Ativar**.

```
você (objetivo/comando)
  └─ CEO Agent ─ analisa, planeja, delega, revisa e pede aprovação
       ├─ Prospecção ─────┐
       ├─ Comercial/SDR   │
       ├─ Marketing       ├─ ferramentas (allowlist por agente) ─┬─ dados da SaaS (CRM, funil, conversas, tarefas, agenda, métricas)
       ├─ Desenvolvimento │                                       └─ n8n (ações externas: prospecção, sequências, publicações, issues, cobranças)
       ├─ Financeiro/Op.  │
       └─ Atendimento/CS ─┘
```

## Telas

| Tela | Caminho | O que mostra |
| --- | --- | --- |
| Equipe IA | `/ai-team` | agentes, status, cargo, provedor/modelo, autonomia, ferramentas, tarefas, consumo, erros, resultados; pausa geral |
| Agente | `/ai-team/agents/:id` | configuração (status, autonomia, provedor/modelo, allowlist, limites), prompts versionados, tarefas, execuções, chamadas de ferramentas |
| Central do CEO | `/ai-team/ceo` | caixa de comando, objetivos, briefing diário, aprovações pendentes, atividades |
| Objetivo | `/ai-team/objectives/:id` | plano, árvore de tarefas, resultado final, aprovações e linha do tempo |
| Tarefas | `/ai-team/tasks` | fila com filtros por status (queued, running, waiting approval, completed, failed, cancelled) |
| Aprovações | `/ai-team/approvals` | ações sensíveis com o payload exato que será executado; aprovar/rejeitar |
| Memória | `/ai-team/memory` | fatos, preferências, aprendizados (empresa e por agente) |
| Custos | `/ai-team/costs` | custo estimado por dia, agente e modelo; orçamento diário/mensal |
| Configurações | `/ai-team/settings` | ativação, orçamentos, limites, briefing, n8n, fila de envios |

Permissões (RBAC): `ai_team.view`, `ai_team.command`, `ai_team.approve`, `ai_team.manage`. Administradores têm todas;
gestores veem e enviam comandos; aprovar e configurar exigem as permissões específicas (papéis personalizados).

## Agentes

| Chave | Cargo | Ferramentas (teto do cargo) |
| --- | --- | --- |
| `ceo` | CEO Agent | leitura de toda a empresa, memória, `agents.delegate`, `tasks.create`, `drafts.write` |
| `prospeccao` | Prospecção | `n8n.prospect_search`, `leads.import_prospects`, `leads.create`, `leads.search` |
| `sdr` | Comercial/SDR | follow-ups, status do lead, funil, agenda, `messages.send`, `n8n.sales_sequence`, `proposals.draft` |
| `marketing` | Marketing | métricas de origem/conversão, rascunhos, `n8n.marketing_publish` |
| `dev` | Desenvolvimento | `dev.request_change`, `n8n.dev_issue` — **nunca** merge na main, deploy ou credenciais |
| `financeiro` | Financeiro/Operações | `finance.overview`, `n8n.finance_charge` (sempre com aprovação) |
| `cs` | Atendimento/CS | conversas aguardando, follow-ups, notas, `messages.send` (não duplica o chatbot em tempo real) |

Cada agente tem **um provedor e um modelo** (OpenAI, Anthropic/Claude ou Google Gemini; "auto" usa o padrão do
ambiente), **autonomia** (manual, supervisionado, autônomo), **allowlist de ferramentas** (subconjunto do teto do
cargo), limites próprios e **prompt versionado** (cada alteração cria uma versão; rollback = ativar uma anterior).

## Comandos

Exemplos que o CEO entende (com ou sem IA configurada):

| Comando | Playbook | O que acontece |
| --- | --- | --- |
| "Analise minha empresa hoje" | `analise_empresa` | lê indicadores, funil, follow-ups, conversas, tarefas, agenda, aprovações e finanças; relatório |
| "Quais leads precisam follow-up?" | `followups` | lista os leads parados e delega ao SDR a criação dos follow-ups |
| "Quero prospectar 30 pousadas em Gramado/RS" | `prospeccao` | Prospecção busca no n8n (aprovação: custo externo), importa sem duplicar; SDR prepara a abordagem |
| "Quero 5 clientes este mês" | `meta_vendas` | calcula a lacuna com dados reais (taxa de ganho, funil), delega follow-ups, prospecção e campanha |
| "Organize prioridades" | `prioridades` | ranking (aprovações, clientes aguardando, atrasos, oportunidades paradas) e tarefa "Prioridades do dia" |
| "Analise meu pipeline" | `pipeline` | etapas, gargalo, oportunidades paradas e conversão; follow-ups para destravar |

**Sem provedor de IA** (PENDENTE DE CREDENCIAL), o CEO executa os playbooks determinísticos acima com os dados reais e
os agentes executam roteiros. Tarefas livres viram tarefas para a equipe humana. **Com IA**, o CEO planeja com o
modelo (o playbook entra como sugestão), lê dados pelas ferramentas, delega e escreve o relatório final.

## Ciclo de um objetivo

1. Comando → `AiObjective` + tarefa de planejamento do CEO (`kind=plan`).
2. O worker reivindica a tarefa (`FOR UPDATE SKIP LOCKED`, lease de 10 min) e executa: leitura de dados, delegações.
3. Agentes executam suas tarefas (`kind=work`): ferramentas com allowlist, aprovação quando exigido, n8n quando externo.
4. Quando todas as tarefas delegadas terminam, o CEO revisa (`kind=review`) e o objetivo é concluído com o relatório.

Estados das tarefas: `QUEUED`, `RUNNING`, `WAITING_APPROVAL`, `COMPLETED`, `FAILED`, `CANCELLED`. Uma tarefa em
`RUNNING` com `waitingFor=n8n:<id>` aguarda o retorno do n8n; `waitingFor=task:<id>` aguarda a etapa anterior.
Falhas temporárias voltam para a fila com backoff (1 min, 5 min, 15 min, 1 h…) até `maxAttempts`.

## Aprovações

Política (`src/server/ai-company/policy.ts`):

| Risco | Manual | Supervisionado | Autônomo |
| --- | --- | --- | --- |
| leitura | automático | automático | automático |
| baixo (tarefas, notas, rascunhos, delegação) | aprovação | automático | automático |
| médio (status, funil, agenda, cadastrar leads) | aprovação | aprovação | automático |
| alto (mensagens a clientes, publicações, chamadas externas) | aprovação | aprovação | aprovação¹ |
| crítico / categoria sensível | **sempre** | **sempre** | **sempre** |

¹ Só é automático se a empresa ligar "ações externas autônomas" (desligado por padrão).
Categorias sensíveis: preço, desconto, contrato, pagamento, gasto, exclusão, credencial, irreversível, merge na main,
deploy em produção — detectadas pela ferramenta e pela varredura do texto que sairia da empresa (ex.: "R$ 300",
"10% de desconto", "link de pagamento"). A aprovação guarda o **payload exato + hash**; o que é aprovado é exatamente o
que executa (alterações depois do pedido invalidam a execução). Aprovações expiram (padrão 72 h).

## Memória

Memórias da empresa (escritas por pessoas) entram no prompt como **diretrizes**; memórias registradas por agentes
(`memory.save`) entram como **dados** delimitados (podem ter sido influenciadas por conteúdo externo). Até 500
memórias por empresa (as mais antigas escritas por agentes são descartadas primeiro).

## Limites e custos

- Passos por execução, tokens por tarefa, profundidade de delegação, tarefas por objetivo, subtarefas por tarefa,
  tentativas e tarefas por agente/dia (`AiCompany.limits` e `AiAgent.limits`).
- Detecção de loop: a mesma ação com os mesmos argumentos repetida encerra a execução.
- Orçamento diário/mensal da empresa e diário por agente (US$, estimado pela tabela de preços — `AI_PRICING_JSON`
  ajusta). Ao atingir, a tarefa espera na fila até o próximo período. A cota mensal de mensagens de IA do plano também vale.

## Briefing diário

Configurável (horário no fuso da empresa, dias da semana, destinatários, envio pelo n8n). Conteúdo: resumo, leads,
follow-ups, propostas, tarefas, prioridades, problemas, oportunidades e aprovações pendentes. Com IA, o CEO abre o
briefing com uma mensagem curta. Também pode ser gerado na hora pela Central do CEO.

## Worker e agendamento

`POST /api/cron/ai` (Bearer `CRON_SECRET`) processa a fila, envia/reenvia ao n8n, recupera execuções interrompidas,
expira aprovações e agenda briefings. Recomendado a cada 1–5 min (fluxo `n8n/workflows/agendador-worker.json` ou cron
externo). A Vercel (plano Hobby) chama 1x/dia como garantia; ações na tela também disparam o processamento.

## Código

`src/server/ai-company/`: `constants` (cargos, prompts), `policy` (aprovação, limites), `security` (prompt injection),
`tools/` (ferramentas), `invoke` (execução de ferramentas), `engine` (executor), `playbooks`, `objectives`, `worker`,
`approvals`, `memory`, `briefing`, `n8n`, `commands`, `agents` (provisionamento/configuração), `queries` (telas).
Provedores de IA: `src/server/ai/{provider,openai,anthropic,gemini,pricing}.ts`.
