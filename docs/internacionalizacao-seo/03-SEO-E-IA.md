# SEO técnico e descoberta por IA

**Não existe método garantido** para ChatGPT, Gemini, Claude ou Google AI Overviews recomendarem uma empresa. O que foi feito é SEO técnico legítimo e conteúdo útil e verificável.

## Implementado

- **Metadados** por página e idioma (títulos ≤ ~75 caracteres, descrições únicas), Open Graph/Twitter com imagem por idioma (`public/og*.png`, geradas por `pnpm og`).
- **Dados estruturados** (JSON-LD): `Organization`+`ProfessionalService` (mesma entidade nos 3 idiomas, endereço = Suzano/SP/BR, `areaServed` BR/US/ES), `WebSite`, `Service` (soluções e segmentos), `BreadcrumbList`, `FAQPage` (só perguntas visíveis na página). **Sem** avaliações ou notas (não existem).
- **Conteúdo**: 7 páginas de solução e 5 de segmento (hotelaria e pousadas, energia solar, clínicas veterinárias, advocacia, construção e reformas) com problemas, funcionalidades, FAQ e links internos cruzados (solução ↔ segmento). Sem páginas duplicadas/artificiais.
- **robots.txt**: tudo liberado; grupos explícitos para Googlebot, Bingbot, OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User. Rastreadores de *treinamento* (GPTBot, ClaudeBot, Google-Extended…) seguem a regra `*` (permitidos); para bloqueá-los, ver comentário em `app/robots.ts`.
- **Sitemap** multilíngue sem `lastmod` (não há data confiável por página).
- **Renderização**: HTML estático completo, legível sem JavaScript (testado).
- **Medição** (GA4, carregado somente após o aceite do visitante): eventos `generate_lead` (formulário), `whatsapp_click`, `email_click`, `language_change` e `ai_referral` (visitas vindas de ChatGPT, Perplexity, Gemini, Claude, Copilot…, por `utm_source`/referrer). Em **qualquer país**, antes do aceite o script do Google não é carregado e nenhum evento é registrado (detalhes em `08-CONSENTIMENTO-DE-COOKIES.md`). No GA4, marque `generate_lead` como evento-chave.

## `llms.txt` — padrão ou experimento?

`public/llms.txt` segue a proposta de llmstxt.org, **que não é um padrão aprovado**; até onde se sabe, os grandes buscadores e assistentes não declaram usá-lo. Foi incluído por custo quase nulo, como conveniência para ferramentas que o leiam. **Não conte com ele**; o que importa é conteúdo, indexação normal e credibilidade.

## Indexação: o que NÃO está comprovado

Nenhuma página foi indexada ou citada por IA até agora — **isso só se prova no Google Search Console** (Inspeção de URL / relatório de páginas) e acompanhando `ai_referral` no GA4. Não afirme indexação sem essa evidência.

## Ações do dono (fora do código)

1. Search Console: enviar `https://hrtechsistemas.com.br/sitemap.xml`, solicitar indexação das páginas novas; considerar Bing Webmaster Tools.
2. Fortalecer informações públicas verificáveis e **consistentes** (nome, cidade, e-mail, WhatsApp): Perfil da Empresa no Google, LinkedIn da empresa (preencher `social.linkedin` em `config/site.ts`), perfis reais em diretórios do setor. Sem avaliações fictícias.
3. Casos reais (ver `04-CONVERSAO-E-DADOS.md`) são o maior ganho de credibilidade.
