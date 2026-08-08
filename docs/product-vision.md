# Visão de Produto — HR Tech

## Missão
Criar soluções SaaS especializadas que simplificam processos empresariais através de software sob medida, IA aplicada e automação.

## Visão
Construir um ecossistema de plataformas empresariais, usado por empresas de diferentes portes e segmentos, todas compartilhando a mesma base de tecnologia e a mesma identidade de marca.

## Problema que resolve
Empresas de setores tradicionais — construção civil, jurídico, logística, indústria, saúde, imobiliário, varejo, hotelaria, distribuição, serviços profissionais — operam com processos manuais, planilhas dispersas e sistemas genéricos que não refletem a realidade do setor. A HR Tech constrói software vertical: feito para o processo real de cada setor, não um sistema genérico adaptado à força.

## Cliente ideal
Empresas pequenas, médias e grandes que precisam de sistemas especializados para o seu setor, hoje mal atendidas por software genérico ou por soluções internas frágeis.

## Como cada SaaS se conecta ao ecossistema
Todo produto SaaS vertical nasce sobre a mesma base (Core: autenticação, usuários, tenants, permissões, auditoria, notificações, billing — ver `architecture.md`) e a mesma identidade visual (`design-system.md`). Um cliente que usa duas soluções da HR Tech reconhece a mesma qualidade e consistência em ambas, mesmo sendo produtos com domínio de negócio completamente diferente. A arquitetura modular (`core` / `shared` / `verticals`) é o que torna essa conexão tecnicamente real — não apenas uma promessa de marketing.

## Escopo deste repositório

**Este repositório (`hrtech-site`) entrega exclusivamente o Portfólio Institucional da HR Tech** — site + backend simples de suporte (formulário de contato). Ver `docs/adr/010-scope-narrowed-to-institutional-portfolio.md`.

O portfólio apresenta a solução para Escritórios de Advocacia apenas de forma visual/conceitual (mockups), nunca como produto funcional. O SaaS jurídico — e as demais verticais — são construídos em projetos/repositórios separados, quando chegar a vez de cada um.

## Produtos (visão de longo prazo da empresa — não é o escopo deste repositório)

| Produto | Papel no ecossistema | Onde é construído |
|---|---|---|
| Portfólio Institucional | Vitrine institucional — porta de entrada, não um produto vendido | Este repositório |
| Jurídico | Vertical SaaS | Repositório próprio (futuro) |
| Construção Civil | Vertical SaaS | Repositório próprio (futuro) |
| Logística | Vertical SaaS | Repositório próprio (futuro) |
| Indústria | Vertical SaaS | Repositório próprio (futuro) |
| Saúde | Vertical SaaS | Repositório próprio (futuro) |
| Imobiliário | Vertical SaaS | Repositório próprio (futuro) |
| Varejo | Vertical SaaS | Repositório próprio (futuro) |
| Hotelaria | Vertical SaaS | Repositório próprio (futuro) |
| Distribuição | Vertical SaaS | Repositório próprio (futuro) |
| Serviços Profissionais | Vertical SaaS | Repositório próprio (futuro) |

Status de cada um em `roadmap.md` — este documento descreve o papel de cada produto na visão de longo prazo da empresa, não o escopo de implementação deste repositório.

## Visão de longo prazo
Evoluir de uma empresa que constrói sistemas sob demanda para uma plataforma de tecnologia que opera múltiplos produtos SaaS simultaneamente, com CRM interno, portal do cliente unificado, marketplace de integrações e inteligência artificial própria — todos compartilhando a mesma fundação técnica descrita em `architecture.md`.

## Posicionamento de marca
Uma empresa de tecnologia de padrão internacional: precisa, confiante, discreta na potência (ver `design-system.md` → Identidade da marca). Nunca promete o que ainda não existe — todo produto em desenvolvimento é apresentado como tal, nunca como funcionalidade pronta, nunca com cliente, case ou métrica inventados. Esse rigor com a verdade é parte do posicionamento, não só uma regra de conteúdo: confiabilidade é praticada, não apenas anunciada.
