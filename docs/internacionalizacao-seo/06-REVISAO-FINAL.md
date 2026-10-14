# Revisão final antes da publicação (14/10/2026)

> Esta revisão é **técnica e editorial**. Não substitui um advogado nem revisão por falantes nativos.

## 1. GitHub Pages — publicação concorrente (requer decisão do dono)

Não foi possível ler *Settings → Pages* (a API de Pages não é acessível nesta sessão). A evidência está nos logs do repositório:

- A cada push na `main` rodam **dois** processos de publicação: `Deploy to GitHub Pages` (workflow do Next.js, correto) e `pages build and deployment` (workflow dinâmico **do próprio GitHub**, build Jekyll da raiz do repositório). Verificado nos 4 últimos pushes (25/09 e 07/10).
- Esse segundo workflow só existe quando a origem está em **"Deploy from a branch"**. Com **"GitHub Actions"**, ele não roda.

**Risco:** os dois publicam no mesmo ambiente `github-pages`; quem terminar por último "vence". Hoje o do Next.js termina depois (≈26 s) e o site fica certo, mas não é garantido — se o Jekyll terminar por último, o site publicado seria a documentação do repositório, não o site.

**Correção proposta (não executada):** *Settings → Pages → Build and deployment → Source = GitHub Actions*. Impacto: o build Jekyll deixa de rodar; o domínio personalizado e o HTTPS continuam configurados nas mesmas configurações; o deploy passa a ser só o workflow `Deploy to GitHub Pages`. Conferir também **Enforce HTTPS**. Depende de autorização do dono; é configuração administrativa, que não foi alterada.

## 2. Revisão de idiomas

Lidos por inteiro os três dicionários (≈20 mil palavras) e conferida a ortografia de EN e ES com dicionários oficiais (nenhum erro real; só termos técnicos e estrangeirismos). O corretor automático **não concluiu para PT-BR** (dicionário muito pesado); o português foi revisado por leitura.

Corrigido:
- **EN:** "performant data" → "fast data"; "Your need does not fit a category?" → "Does your project not fit a standard category?"; "win quotes" → "win more jobs"; "budget stage"; "We watch real usage" → "We monitor real-world usage and ship…".
- **ES (Espanha):** "tutores" → "propietarios" (clínicas veterinárias); "cronograma" → "planificación" (latino-americanismo); título "chatbots IA" → "chatbots con IA"; títulos reduzidos para ≤75 caracteres.
- **PT:** FAQ passa a declarar "Não temos escritório fora do Brasil" (já havia em EN/ES).
- **Rodapé:** o CNPJ agora vem explicado ("Brazilian company ID (CNPJ)", "Identificación fiscal brasileña (CNPJ)").
- Conferidos botões, formulários (PT/EN/ES, desktop e mobile), menus e mensagens de WhatsApp (geral e por segmento).

## 3. SEO e descoberta por IA

- `pnpm verify` valida as **51 páginas** (17 × 3): **45 indexáveis** e **6 `noindex` de propósito** (privacidade e termos nos 3 idiomas, decisão do dono desde setembro). O sitemap lista as 45; nenhuma página `noindex` entra no sitemap nem no hreflang.
- hreflang recíproco, canonical autorreferente, 1 `<h1>`, JSON-LD válido (FAQPage só com perguntas visíveis), robots com Googlebot, Bingbot, OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User liberados. Conteúdo legível sem JavaScript (testado).
- **Sem promessa de indexação ou de recomendação por IA.** Indexação só se comprova no Search Console.
- Observação: o export gera `/404/` (marcado `noindex, nofollow`, fora do sitemap) além de `404.html`.

## 4. Privacidade e termos (revisão técnica)

Corrigido:
- A política dizia que o site "não usa cookies próprios de rastreamento", mas o Google Analytics grava cookies de primeira parte (`_ga`) para visitantes fora da Europa → texto corrigido nos 3 idiomas.
- Faltavam: identificação do controlador (com CNPJ), prestadores/destinatários (Google, Meta/WhatsApp, e-mail), transferências internacionais, prazo de guarda e autoridades (ANPD/AEPD) → incluídos nos 3 idiomas.
- Faltava como **mudar/retirar** a decisão sobre cookies → link "Preferências de cookies" no rodapé (testado).

**Depende de aprovação jurídica (não resolvido):**
1. **Base legal** do tratamento (LGPD art. 7 / GDPR art. 6) não está declarada; o GDPR (art. 13) exige informá-la.
2. **Prazo de guarda** está genérico ("o tempo necessário"); definir prazo concreto.
3. **Quem é o controlador:** o CNPJ é um CCMEI em nome de Hadrian Rafael Silva de Oliveira; confirmar como o titular deve ser identificado.
4. **Transferências internacionais:** mecanismo aplicável (decisão de adequação, cláusulas-padrão) para dados de residentes da UE/Reino Unido tratados no Brasil e pelo Google nos EUA; avaliar necessidade de **representante na UE/Reino Unido** (GDPR art. 27).
5. **Consentimento de cookies:** o aviso aparece pelo **fuso horário** (aproximação, falha com VPN ou visitantes europeus em outro fuso); o Consent Mode "denied" ainda envia pings sem cookies ao Google (avaliar se basta); cookies já gravados não são apagados ao recusar depois.
6. **Termos de uso:** sem lei aplicável, foro, limitação de responsabilidade; aceite por navegação (*browsewrap*) é frágil; "prevalece a versão em português" pode ser questionado por clientes estrangeiros.
7. **EUA:** confirmar se leis estaduais de privacidade (ex.: CCPA) se aplicam e se a declaração "não vendemos nem compartilhamos dados" é suficiente.
8. **Segmento advocacia:** referências a regras de publicidade (Provimento 205/2021 da OAB; Estatuto Geral e Código Deontológico espanhóis) devem ser conferidas por advogados desses países.

## 5. Testes finais

`pnpm check` (lint, typecheck, 59 testes, build, verify) ✔ · Chromium: 59 checagens (idiomas, detecção, seletor, formulários PT/EN/ES em desktop e mobile, WhatsApp por segmento, consentimento, âncoras, sem JavaScript) ✔ · axe: 0 violações em 36 combinações ✔ · `git diff main` não toca `apps/` (HR Tech Omni intacto); o `hrtech-saas` está fora do escopo desta sessão e não foi acessado.

## Pendências

- Decisão do dono: origem do Pages (item 1) e autorização para qualquer deploy/merge.
- Revisão nativa EN/ES e revisão jurídica (item 4).
- Search Console (enviar sitemap, solicitar indexação); formulário com endpoint; portfólio; LinkedIn.
- Sincronização com o Obsidian (indisponível nesta sessão).
