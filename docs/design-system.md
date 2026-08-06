# Design System — HR Tech

Este documento é a fonte de verdade visual da HR Tech. Toda página do site institucional e, futuramente, toda plataforma SaaS vertical (Construção Civil, Jurídico, Logística, etc.) constrói sobre esta base — com liberdade para pequenas personalizações por vertical, nunca perdendo a identidade da marca.

Implementado como `packages/ui` no monorepo, construído **antes** de qualquer página.

## 0. Design Principles

- Clareza acima da complexidade.
- Consistência em todas as interfaces.
- Performance é parte do design, não uma etapa posterior.
- Cada animação deve comunicar algo — nunca existe só para impressionar.
- Acessibilidade desde o primeiro componente, não como revisão final.
- Componentes reutilizáveis antes de soluções específicas de um vertical.
- Simplicidade sem perder sofisticação.

## 1. Identidade da marca

HR Tech é uma software house que constrói sistemas, SaaS e automação sob um padrão de engenharia rigoroso. Personalidade: **precisa, confiante, discreta na potência** — poder sem exagero visual, evitando o tom de "startup exagerada". Valores: precisão técnica, inovação aplicada (nunca hype vazio), transparência (nunca apresenta cliente, case ou métrica que não exista), ambição de longo prazo. Percepção-alvo: uma empresa internacional de tecnologia, séria o bastante para atender empresas grandes, ágil o bastante para continuar sendo a HR Tech.

## 2. Logotipo

Especificação (a arte final do logo é produzida separadamente, como tarefa de design visual):

- Wordmark "HR Tech" + monograma "HR" como ícone standalone (favicon, avatar, app icon).
- Versão para fundo escuro: branco ou gradiente HR Tech Ignite sobre preto — caso de uso dominante, já que o site é dark-first.
- Versão para fundo claro: preto sólido.
- Área de proteção mínima: altura do "H" em todos os lados.
- Tamanho mínimo: 24px de altura em contexto digital.
- Usos incorretos: nunca aplicar o gradiente no texto e no ícone ao mesmo tempo (escolher um); nunca distorcer proporção; nunca aplicar sobre imagem sem overlay de contraste suficiente.

## 3. Paleta de cores

Preto, branco, vermelho e laranja — deliberadamente fora do padrão azul da maioria das empresas de tecnologia.

| Token | Uso | HEX | RGB | HSL |
|---|---|---|---|---|
| `ink-900` | Fundo dominante do site (dark-first) | `#0D0D0D` | `13, 13, 13` | `0°, 0%, 5%` |
| `white` | Texto sobre fundo escuro, superfícies claras de alta ênfase | `#FFFFFF` | `255, 255, 255` | `0°, 0%, 100%` |
| `paper-50` | Fundo de seções claras, cards em modo claro | `#FAFAFA` | `250, 250, 250` | `0°, 0%, 98%` |
| `ember-500` | Cor de marca — CTA primário, estados ativos, destaques de alta urgência | `#E92034` | `233, 32, 52` | `354°, 82%, 52%` |
| `solar-500` | Cor de marca — destaques secundários, hover, ícones, badges de IA/inovação | `#FF871F` | `255, 135, 31` | `28°, 100%, 56%` |
| `graphite-700` | Texto secundário e bordas em modo claro | `#2E2E2E` | `46, 46, 46` | `0°, 0%, 18%` |
| `graphite-400` | Texto terciário, placeholders | `#8A8A8A` | `138, 138, 138` | `0°, 0%, 54%` |
| `danger-600` | Erros de formulário/sistema — distinto do `ember-500` de marca, para não confundir CTA com erro | `#B91C2C` | `185, 28, 44` | `353°, 74%, 42%` |
| `success-500` | Confirmações | `#1FAE64` | `31, 174, 100` | `152°, 70%, 40%` |
| `info-500` | **Uso exclusivamente funcional** — mensagens informativas de sistema/formulário. Nunca usado em elementos de marca ou CTA. | `#2F80ED` | `47, 128, 237` | `214°, 84%, 56%` |

**Neutros de superfície** (profundidade entre cards e seções em fundo escuro, sem depender só de preto puro):

| Token | Uso | HEX |
|---|---|---|
| `surface-900` | Fundo base da página | `#0D0D0D` |
| `surface-800` | Card sobre o fundo base | `#131313` |
| `surface-700` | Card elevado / estado de hover | `#1C1C1C` |
| `surface-600` | Borda / divisor sobre fundo escuro | `#262626` |

**Gradiente proprietário "HR Tech Ignite":** `linear-gradient(135deg, #E92034 0%, #FF871F 100%)`. Uso: texto de destaque em headlines curtas, background de botões primários, números/estatísticas em destaque, borda superior de cards premium. Nunca em blocos de texto corrido.

## 4. Tipografia

Família única: **Geist Sans** para títulos, corpo e botões; **Geist Mono** para acentos técnicos (badges de versão, números de estatística, labels de status). Uma família só reduz requisições e melhora performance de carregamento.

| Estilo | Tamanho | Peso | Line-height | Tracking |
|---|---|---|---|---|
| Display (hero) | 64px | 600 | 1.05 | -0.02em |
| H1 | 48px | 600 | 1.1 | -0.015em |
| H2 | 36px | 600 | 1.15 | -0.01em |
| H3 | 28px | 500 | 1.2 | 0 |
| H4 | 22px | 500 | 1.3 | 0 |
| Body grande | 18px | 400 | 1.6 | 0 |
| Body | 16px | 400 | 1.7 | 0 |
| Body pequeno | 14px | 400 | 1.6 | 0 |
| Label / caption | 13px | 500 | 1.4 | 0.04em, uppercase |
| Botão | 15px | 600 | 1 | 0 |

## 5. Design tokens

- **Espaçamento** (base 4px): `4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128`
- **Radius:** `sm 6px` · `md 10px` · `lg 16px` · `xl 24px` · `full 9999px`
- **Sombra:** escala `sm/md/lg/xl` em preto translúcido (superfícies claras) + variante **glow** em `ember-500`/`solar-500` a baixa opacidade, usada em hover de CTA primário
- **Opacidade:** disabled `40%` · hover overlay `8%` · backdrop `60%`
- **Z-index:** dropdown `1000` · sticky `1100` · modal-backdrop `1200` · modal `1300` · popover `1400` · toast `1500` · tooltip `1600`
- **Breakpoints:** `sm 640` · `md 768` · `lg 1024` · `xl 1280` · `2xl 1536`
- **Duração:** `fast 150ms` · `base 250ms` · `slow 400ms` · `slower 600ms`
- **Easing:** padrão `cubic-bezier(0.4,0,0.2,1)` · entrada `cubic-bezier(0.2,0,0,1)` · saída `cubic-bezier(0.4,0,1,1)`

## 6. Componentes

Biblioteca construída sobre **Radix UI** (primitivos headless — acessibilidade de teclado/ARIA corretas por padrão) com a camada visual do Design System por cima. Todo componente interativo documenta os estados: default, hover, active, focus, disabled, loading.

Construída em fases — isso também é o roadmap de versões do próprio Design System:

**v1.0 — construído nesta etapa (cobre o site institucional):**
tokens, Button, Card, Input, Select, Modal, Alert, Badge, Header, Footer, Menu, Breadcrumb, Pagination, Tabs, Accordion, Toast, Empty State, Skeleton Loader, Tooltip, Table (básica).

**v1.1 — quando o primeiro painel/dashboard interno for construído:**
Sidebar, Command Palette, Search, Drawer, Data Table avançada (sort/filter/paginação server-side), Dashboard Cards, KPI Cards, Stepper, Timeline, Calendar, Date Picker.

**v2.0 — quando o primeiro SaaS vertical for lançado:**
componentes específicos de domínio, templates de dashboard completos, biblioteca avançada de formulários (wizards multi-step, form builders).

## 7. Motion

- **Scroll reveal:** fade + `translateY(16px)`, stagger de 60ms entre itens de uma lista.
- **Hover** (cards/botões): `scale(1.02)` + sombra/glow, 150ms.
- **Parallax:** leve, deslocamento máximo de 15%; desativado em mobile e quando `prefers-reduced-motion` está ativo.
- **Transição de página:** fade, 200ms.
- **Regra:** toda animação existe para melhorar a compreensão da interface (hierarquia, feedback, continuidade espacial) — nunca só para impressionar. Implementado via Framer Motion.

## 8. Ícones

**Tabler Icons** (outline, ~5800 ícones, open-source). Stroke width 1.5–2px. Tamanhos padrão: 20px inline, 24px standalone. Sempre outline, nunca filled. Cor herdada do texto/contexto.

## 9. Imagens

Mockups 3D discretos de dashboards/interfaces via React Three Fiber, usados pontualmente (home, páginas de solução) — nunca por padrão em toda página. Fundos com gradiente/glow abstrato no lugar de fotos genéricas. Quando fotografia de pessoas for necessária: ambiente corporativo real, nunca banco de imagens genérico. Direção de longo prazo: priorizar ilustração e mockup produzidos pela própria HR Tech, reduzindo gradualmente a dependência de imagem externa conforme a marca evolui.

## 10. Acessibilidade

- Contraste mínimo AA: 4.5:1 para texto corrido, 3:1 para texto grande/componentes de UI.
- Anel de foco visível em `solar-500`, 2px de offset.
- Área clicável mínima: 44×44px.
- Navegação por teclado segue a ordem visual.
- `prefers-reduced-motion` respeitado em toda animação.
