# Internacionalização — como funciona

## URLs

| Idioma | Raiz | Exemplo (serviço de IA) |
| --- | --- | --- |
| Português (Brasil) | `/` (URLs históricas **preservadas**) | `/solucoes/inteligencia-artificial/` |
| Inglês (EUA) | `/en-us/` | `/en-us/services/ai-chatbots/` |
| Espanhol (Espanha) | `/es-es/` | `/es-es/servicios/chatbots-inteligencia-artificial/` |

Cada idioma tem **17 páginas** (Home, índice de soluções, 7 soluções, índice de segmentos, 5 segmentos, privacidade e termos), com slugs no idioma do mercado. A tabela de rotas está em `lib/i18n/routes.ts`.

## Como cada requisito foi atendido

- **`<html lang>` correto no HTML estático**: cada idioma tem seu layout raiz (`app/(pt)`, `app/en-us`, `app/es-es`), sem depender de JavaScript.
- **hreflang**: pares `pt-BR/en-US/es-ES`, idiomas genéricos (`pt`, `en`, `es`, para falantes de outros países) e `x-default` → **versão em inglês** (fallback para idiomas não atendidos; decisão editável em `lib/i18n/config.ts`). Recíproco e verificado pelo `pnpm verify`.
- **Canonical** autorreferente por idioma; sitemap multilíngue com alternativas; páginas `noindex` (privacidade/termos) fora do sitemap e sem hreflang.
- **Sem redirecionamento por geolocalização**: robôs e visitantes sempre recebem a página solicitada.
- **Detecção** (`lib/i18n/detect.ts`): idiomas do navegador + fuso horário como indicador aproximado do país (o site é estático, não há IP). Resultado = **aviso discreto** sugerindo o idioma, nunca redirecionamento.
- **Preferência manual prevalece**: ao clicar no seletor (PT · EN · ES) ou no aviso, a escolha é gravada (`localStorage: hrtech:locale`). Com preferência gravada, não há mais sugestão automática, e ao abrir a Home da raiz (`/`) o visitante vai direto ao idioma escolhido.
- **Sem tradução automática em tempo real**: todo texto é estável e revisável, em `content/<idioma>/`. O TypeScript obriga os três dicionários a terem a mesma estrutura.

## Adicionar um país/idioma depois

1. `lib/i18n/config.ts`: incluir o código em `locales` e `localeSettings` (prefixo, moeda, imagem OG).
2. `lib/i18n/routes.ts`: slugs e âncoras do novo idioma.
3. `content/<novo>/`: dicionário completo (o TypeScript indica o que falta) e `lib/i18n/detect.ts`.
4. Criar `app/<prefixo>/layout.tsx` e `app/<prefixo>/[[...slug]]/page.tsx` (copiar de `app/en-us`).
5. `pnpm og` (imagem de compartilhamento), `pnpm check`.

## Atenção

- **Revisão por falantes nativos**: os textos EN/ES foram redigidos adaptando ao mercado (não ao pé da letra), mas **devem ser revisados por um falante nativo** antes de divulgar. Idem as políticas de privacidade/termos, que não passaram por advogado.
- Não há afirmação de escritório, clientes ou certificações fora do Brasil (testado em `tests/content.test.ts`).
