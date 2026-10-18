# Auditoria de dependências (`pnpm audit`)

Contexto: o site é exportado como arquivos estáticos (`output: 'export'`, `images.unoptimized`) e publicado no GitHub Pages. Não há servidor Next.js em produção: o código de `next`, `postcss` e `sharp` roda apenas no build (GitHub Actions) e no desenvolvimento local.

Todos os 8 alertas originais vinham de `next@15.5.26` (dependência direta e transitiva via `geist`).

| # | Pacote | Severidade | Versão afetada → corrigida | Explorável no site publicado? | Correção |
| --- | --- | --- | --- | --- | --- |
| 1 | next (GHSA-4jqv-mc3x-m676) | moderada | 15.5.26 → ≥15.5.27 | Não. Envenenamento de cache de SSG/ISR em servidor Next.js próprio; o GitHub Pages serve arquivos estáticos | `next` 15.5.28 |
| 2 | next (GHSA-mcj8-r9mp-w47p) | moderada | idem | Não (idem) | `next` 15.5.28 |
| 3 | postcss (GHSA-qx2v-qp2m-jg93) | moderada | 8.4.31 → ≥8.5.10 | Não. XSS na reserialização de CSS; só afeta o build, com CSS nosso | override `next>postcss` ^8.5.30 |
| 4 | postcss (GHSA-6g55-p6wh-862q) | alta | 8.4.31 → ≥8.5.12 | Não. Leitura de arquivo via source map controlado por atacante; build apenas | idem |
| 5 | postcss (GHSA-fxqj-rqcc-2cmp) | moderada | 8.4.31 → ≥8.5.23 | Não (build) | idem |
| 6 | postcss (GHSA-r28c-9q8g-f849) | alta | 8.4.31 → ≥8.5.18 | Não (build) | idem |
| 7 | source-map-js (GHSA-68fv-2mgg-jv7q) | alta | 1.2.1 → ≥1.2.2 | Não. Negação de serviço ao ler source map malicioso; build apenas | override `source-map-js` ≥1.2.2 |
| 8 | sharp (GHSA-wq5f-xc86-pv6w) | alta | 0.35.4 → ≥0.35.5 | Não. Falha no librsvg ao processar SVG não confiável; o site não otimiza imagens e o script `og` só lê um SVG escrito no repositório | `sharp` ^0.35.5 (lockfile em 0.35.5) |

Mesmo os itens "não explorável em produção" foram corrigidos porque a menor atualização segura existe e não muda comportamento; evita ruído em auditorias futuras.

## Resultado

- `pnpm audit --prod`: **nenhuma vulnerabilidade conhecida** (antes: 8).
- Também alinhado `eslint-config-next` a 15.5.28 (mesma versão do Next).
- Validado: lint, typecheck, 60 testes, build, verificação das 51 páginas (pt-BR 17, en-US 17, es-ES 17), teste de navegador do consentimento (137 verificações, 0 falhas), axe (0 violações em 36 combinações), HTML estático sem referência ao Google Analytics, `hreflang` e JSON-LD presentes.

## Riscos restantes (somente desenvolvimento/build; nenhum vai para o site publicado)

| Pacote | Severidade | Origem | Situação |
| --- | --- | --- | --- |
| braces ≤3.0.3 (GHSA-vfj7-8cjw-p6xm) | alta | `eslint-config-next` → fast-glob → micromatch; `tailwindcss` → chokidar | Negação de serviço por padrão de glob malicioso. Sem versão corrigida publicada no momento da auditoria. Entradas são nossas; sem exposição. Reavaliar em atualização futura |
| postcss-selector-parser 6.1.4 (GHSA-rj75-hqrm-r3gf) | moderada | `tailwindcss` 3.4 | Complexidade quadrática com seletores maliciosos, só no build. A correção está na série 7.x e exigiria trocar para Tailwind 4 (mudança grande, fora do escopo). Sem exposição, pois os seletores são nossos |

Esses dois só aparecem em `pnpm audit` completo (inclui devDependencies); o `pnpm audit --prod` está limpo.

## Observação operacional

As alterações de versão estão em `package.json` (`next` ^15.5.28, `sharp` ^0.35.5 e `pnpm.overrides`) e em `pnpm-lock.yaml`. Os overrides devem ser revistos quando o Next publicar uma versão que já use um postcss corrigido.
