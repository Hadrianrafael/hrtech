# ADR 008 — Baseline de segurança implementado desde o bootstrap

## Status
Aceito

## Contexto
Um checklist de segurança foi levantado (CSP, rate limiting, Helmet, CORS, validação de entrada, sanitização, CSRF, headers de segurança). Era preciso decidir o que entra nesta etapa de arquitetura versus o que é adiado — usando o mesmo princípio de escopo do resto do projeto (`architecture.md` → "Princípio de escopo").

## Decisão
A maior parte do checklist é **configuração de bootstrap**, não feature — implementada nesta etapa por ser trivial e sem custo de manutenção contínua:

- **Helmet** — headers de segurança padrão (`X-Content-Type-Options`, `X-Frame-Options`, etc.), uma linha de configuração no `main.ts`.
- **CORS** — origem explícita do front-end, sem wildcard.
- **Rate limiting** (`@nestjs/throttler`) — nos endpoints públicos, principalmente `POST /contact`.
- **Validação e sanitização de entrada** — `class-validator` + `ValidationPipe` global com `whitelist: true` (rejeita campos não declarados no DTO).
- **CSP** — política conservadora (`default-src 'self'`) desde já, refinada por diretiva conforme fontes externas reais forem adicionadas (Google Fonts, Analytics).

Adiado, com gatilho explícito:

- **CSRF** — só é necessário se a autenticação migrar de JWT bearer (esquema atual, ver ADR 003) para cookie de sessão. Enquanto a auth for por token no header, o vetor de ataque que CSRF protege não se aplica. Gatilho: adoção de auth por cookie.

## Consequências
- Nenhum endpoint entra em produção sem a camada básica de proteção — não existe uma fase futura de "adicionar segurança depois".
- CSRF fica documentado e não implementado sem gerar dívida técnica invisível: a condição que o tornaria necessário está registrada, então a decisão não precisa ser redescoberta.
- CSP conservadora pode inicialmente bloquear algum recurso externo legítimo (ex: um script de terceiro adicionado depois) — comportamento esperado; a diretiva é ampliada caso a caso, nunca com um `unsafe-inline` genérico por conveniência.
