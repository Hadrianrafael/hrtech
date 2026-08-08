# ADR 010 — Escopo deste repositório reduzido a Portfólio Institucional

## Status
Aceito — substitui, para este repositório, as partes de ADR 001, ADR 003 e ADR 005 relacionadas a hospedar o ecossistema SaaS (Core multi-tenant e `verticals/`) na mesma base de código.

## Contexto
ADR 001, ADR 003 e ADR 005 tratavam este repositório como a fundação de um ecossistema maior: monorepo preparado para múltiplos SaaS verticais, banco de dados multi-tenant desde o início, e pastas `core/` / `shared/` / `verticals/` convivendo com o site institucional (`website/`).

O dono do produto decidiu explicitamente o contrário: **este repositório é exclusivamente o portfólio institucional da HR Tech.** O futuro SaaS jurídico (e as demais verticais) será construído em um projeto/repositório separado, com seu próprio código, banco de dados, backend, frontend e deploy — não dentro deste monorepo.

## Decisão
- Este repositório (`hrtech-site`) hospeda **apenas**: o site institucional e um backend simples de suporte (formulário de contato e funcionalidades institucionais equivalentes).
- Não são construídos aqui: autenticação de SaaS, multi-tenancy, modelos de domínio jurídico (ou de qualquer vertical), dashboard funcional, CRM, financeiro, agenda, gestão de documentos, ou qualquer API de produto SaaS real.
- A seção "Soluções para Advocacia" do site é **apresentação visual/conceitual** (mockups de telas), nunca o produto funcional.
- `docs/adr/003-multi-tenant-strategy.md` (estratégia multi-tenant) e a divisão `core/` / `shared/` / `verticals/` de `docs/adr/005-module-boundaries.md` **não se aplicam a este repositório** — ficam preservados como referência de design para quando o projeto separado do SaaS for iniciado, mas não são implementados aqui.
- `apps/api/prisma/schema/` deste repositório contém apenas o schema necessário para o backend institucional (hoje: nenhum model; o próximo a entrar é o de submissões de contato). Nenhuma entidade `Tenant`/`User`/`Role`/etc. do Core é criada aqui.
- A estrutura de módulos do back-end (`apps/api/src/modules/`) não precisa das pastas `core/`, `shared/`, `verticals/` previstas em ADR 005 — os módulos institucionais (ex: `contact/`) vivem diretamente sob `modules/`, seguindo a camada domain/application/infrastructure/presentation de ADR 004.

## Consequências
- Menos infraestrutura para manter e revisar antes de publicar o portfólio — alinhado ao objetivo de "colocar o site no ar o mais rápido possível" already stated pelo dono do produto.
- Quando o SaaS jurídico for iniciado como projeto separado, ADR 003 e a parte de `verticals/`/`core/` de ADR 005 continuam válidas como ponto de partida de design para esse novo repositório — não precisam ser redecididas do zero, só realocadas.
- `docs/product-vision.md` e `docs/roadmap.md` são atualizados para refletir que este repositório entrega só o portfólio; a visão de ecossistema multi-produto continua descrita como visão de longo prazo da empresa, mas não como escopo de implementação deste repositório.
