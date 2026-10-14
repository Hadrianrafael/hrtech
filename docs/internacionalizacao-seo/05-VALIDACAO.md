# Validação (11–14/10/2026)

| Verificação | Resultado |
| --- | --- |
| `pnpm lint` / `typecheck` | sem erros |
| `pnpm test` (Vitest) | 9 arquivos, 59 testes: rotas, detecção, hreflang, sitemap, robots, JSON-LD, conteúdo (3 idiomas com a mesma estrutura; sem afirmações proibidas), formulário, WhatsApp, analytics, preços |
| `pnpm verify` (`scripts/verify-build.mjs`) | 51 páginas (17 × 3): `lang`, título/descrição únicos, canonical, hreflang recíproco, 1 `<h1>`, JSON-LD válido, FAQ visível, `alt`, links internos e âncoras, sitemap, robots, llms.txt — 0 erros |
| Navegador (Chromium/Playwright), 49 checagens | detecção por idioma+fuso (EUA/Espanha/Brasil), sem redirecionamento, preferência manual, seletor mantém a página, formulário EN com mensagem em inglês, `ai_referral`, sem JavaScript (conteúdo + hreflang no HTML), âncoras, mobile 390 px sem rolagem horizontal, sem erros de console |
| Consentimento (Chromium, 137 checagens: 3 idiomas × desktop 1280 e mobile 390 × fusos America/Sao_Paulo, America/New_York, Europe/Madrid, Asia/Tokyo) | primeira visita sem nenhuma requisição ao Google; recusar remove `_ga`/`_ga_*`/`_gid`/`_gat*` e preserva outros cookies; alterar a escolha pelo rodapé; aceite lembrado; `localStorage` bloqueado sem erro — detalhes em `08-CONSENTIMENTO-DE-COOKIES.md` |
| Acessibilidade (axe-core, WCAG 2.0/2.1 A+AA + boas práticas) | 0 violações em 36 combinações (3 idiomas × 6 páginas × desktop/mobile) |
| Lighthouse (mediana de 3, mesmo ambiente) | `main` original: Perf 93–94 · novo: PT 90, EN 92, ES 93; Acessibilidade 100, SEO 100, Boas práticas 96, CLS 0 |

**Desempenho**: a Home ficou ~12% maior (conteúdo novo: FAQ, segmentos, rodapé). Sem otimização a nota caiu para 86–89; o adiamento de renderização das seções abaixo da dobra (`content-visibility`, com correção para navegação por âncora) recuperou quase tudo. O restante é o custo do conteúdo adicional.

**Não verificado**: o site público (rede bloqueada neste ambiente); Search Console/indexação; cabeçalhos HTTP (GitHub Pages não permite CSP/HSTS próprios — exigiria CDN/proxy); revisão nativa dos textos EN/ES.
**Segurança básica**: nenhum segredo nos arquivos; `dangerouslySetInnerHTML` só com constantes (JSON-LD escapa `<`); links externos com `rel="noopener noreferrer"`; honeypot no formulário.
