# ADR 006 — Design System próprio, construído antes das páginas

## Status
Aceito

## Contexto
O site precisa transmitir um padrão visual premium e consistente, e será a base visual reaproveitada por até 10 futuros produtos SaaS verticais. Construir páginas primeiro e extrair um Design System depois é o caminho mais comum, mas gera inconsistência visual acumulada e retrabalho quando o primeiro SaaS vertical precisar da mesma identidade.

## Decisão
`packages/ui` (tokens + biblioteca de componentes) é construído **antes** de qualquer página do site, como pacote próprio do monorepo. Detalhes completos (paleta, tipografia, tokens, componentes, motion) estão em `design-system.md`.

Decisões-chave:
- Paleta preto/branco/vermelho/laranja com gradiente proprietário, deliberadamente fora do padrão azul do mercado de tecnologia.
- Tipografia única (Geist Sans/Mono) — reduz requisições, melhora performance de carregamento.
- Componentes construídos sobre Radix UI (primitivos headless) — acessibilidade de teclado/ARIA corretas por padrão, sem reimplementar do zero.
- Biblioteca de componentes versionada em fases (v1.0/v1.1/v2.0 — ver `design-system.md` e `roadmap.md`), não construída inteira de uma vez.

## Consequências
- A primeira etapa do projeto entrega zero páginas visíveis publicamente, mas entrega a base que todas as páginas (e futuros SaaS) vão consumir — trade-off aceito conscientemente (ver ADR 001).
- Toda futura plataforma SaaS herda a identidade visual da HR Tech por padrão, podendo receber pequenas personalizações pontuais sem perder consistência de marca.
- Mudança de token de design (cor, espaçamento, tipografia) se propaga para todo o ecossistema a partir de um único lugar.
