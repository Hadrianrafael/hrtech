# Requisitos de hospedagem

A plataforma é **portável** (Node.js + PostgreSQL). Não há adaptação específica para hospedagem compartilhada.

## Requisitos

| Componente | Requisito |
| --- | --- |
| Aplicação | Node.js 20+ executando Next.js 15 (servidor Node, não apenas arquivos estáticos); 512 MB RAM ou mais |
| Banco | PostgreSQL 14+ com Row-Level Security; usuário de migração com `CREATEROLE` (cria o papel `hrtech_rls`) |
| Agendamento | chamada HTTP periódica a `/api/cron/tick` (diária) e `/api/cron/ai` (a cada 1–5 min) com `CRON_SECRET` |
| n8n | instância própria (Docker/VPS) ou n8n Cloud, acessível pela SaaS e com acesso à URL pública da SaaS |
| HTTPS | obrigatório (webhooks da Meta, n8n, cookies seguros) |

## Opções recomendadas

1. **Vercel + Neon** (atual): build e migrations automatizados (`docs/DEPLOY.md`); cron diário da Vercel + agendador do n8n.
2. **VPS/Docker** (Azure, AWS, DigitalOcean, Hostinger VPS etc.): `Dockerfile` (saída standalone) + PostgreSQL gerenciado + n8n em container.

## Hospedagem compartilhada (ex.: HostGator)

Planos compartilhados normalmente **não** executam um servidor Node.js persistente, não oferecem PostgreSQL com RLS e
`CREATEROLE`, e limitam tarefas agendadas — por isso não são suportados sem perdas. Caminhos possíveis sem alterar o
código: manter o site institucional na hospedagem atual e apontar um subdomínio (ex.: `app.`) para a Vercel ou uma
VPS; ou contratar um plano VPS/cloud com Node.js 20 e PostgreSQL.
