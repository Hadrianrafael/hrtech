# ADR 005 — Fronteiras entre Core, Shared, Website e Verticals

## Status
Aceito

## Contexto
A HR Tech vai construir até 10 produtos SaaS verticais sobre a mesma base. Sem uma convenção clara de onde cada tipo de código vive, o risco é (a) inflar o Core com funcionalidades específicas de um único vertical, ou (b) duplicar a mesma capacidade (ex: upload de arquivo, comentários) em cada vertical separadamente.

## Decisão
Quatro categorias de módulo, com regra de dependência unidirecional:

```
apps/api/src/modules/
├── core/          # auth, users, tenants, rbac, audit, notifications, api-keys
├── shared/         # capacidades reaproveitadas por 2+ verticals — extraídas, não criadas por antecipação
├── website/          # o site institucional da HR Tech — irmão de core, NÃO um vertical de negócio
└── verticals/          # produtos SaaS (construction, legal, logistics, ...)
```

`verticals/*` e `website/*` podem depender de `core/*` e `shared/*`. Nunca o contrário — `core/` não conhece nenhum vertical específico.

**Por que `website` não é um vertical:** o site institucional é a vitrine da empresa, não um produto de negócio vendido a um cliente. Tratá-lo como vertical misturaria a responsabilidade de "mostrar a empresa" com a responsabilidade de "vender um SaaS para uma empresa cliente".

**Regra de extração para `shared/`:** um módulo só é criado em `shared/` quando o **segundo** consumidor real precisar da mesma capacidade que o primeiro vertical já implementou (ex: "arquivos" usado por `construction` e depois por `legal`). Neste momento o módulo original é generalizado e extraído de dentro do vertical que o originou; ambos os verticais passam a depender de `shared/<módulo>`. Nunca é criado por antecipação, sem um segundo consumidor real.

No front-end, a mesma convenção organiza `apps/web/` por feature: `website/{home,about,portfolio,contact,solutions,landing-pages}` hoje, `verticals/<nome>/<feature>` no futuro.

## Consequências
- O Core permanece pequeno e estável — mudanças em um vertical nunca forçam mudança no Core.
- `shared/` só existe com conteúdo real, nunca como pasta vazia especulativa — evita a armadilha comum de "infraestrutura compartilhada" que na prática só um módulo usa.
- Ao começar o segundo SaaS vertical, parte do trabalho já é genuinamente reutilização (Core inteiro + o que já tiver sido extraído para `shared/`), não recomeço.
