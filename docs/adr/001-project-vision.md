# ADR 001 — Visão do projeto

## Status
Aceito

## Contexto
A HR Tech precisa de um site, mas o pedido original já deixa claro que o site é só a primeira peça de um ecossistema maior: portfólio, futuras plataformas SaaS verticais (construção civil, jurídico, logística, indústria, saúde, imobiliário, varejo, hotelaria, distribuição, serviços profissionais), dashboard administrativo, área do cliente, CRM, integrações de IA, área financeira. Construir só o site, sem considerar esse crescimento, geraria retrabalho estrutural significativo assim que o primeiro SaaS começasse a ser desenvolvido.

## Decisão
Tratar o projeto desde o primeiro commit como a fundação de um ecossistema, não como "só um site":
- Monorepo preparado para múltiplos apps (hoje: `web` + `api`; no futuro: painéis por SaaS)
- Banco de dados multi-tenant desde o início
- Design System próprio, construído antes de qualquer página
- Documentação de arquitetura viva (`docs/`), para que decisões não precisem ser re-discutidas a cada novo produto

Isso é balanceado por um princípio de escopo explícito (ver `architecture.md` → "Princípio de escopo"): a fundação é robusta, mas nenhuma infraestrutura é construída antes de ter um caso de uso real. Preparar a base ≠ implementar todas as features previstas.

## Consequências
- Primeira etapa do projeto é mais lenta que "só subir um site" — o investimento é em arquitetura, não em páginas visíveis.
- Toda decisão de escopo precisa responder: "isso serve ao site institucional agora, ou é especulação sobre um SaaS que ainda não existe?" — a resposta correta muda o que entra nesta etapa vs. o que vai para `architecture.md` como adiado.
- Documentação (`docs/`) é tratada como parte entregável da arquitetura, não como nice-to-have — é o que evita decisões inconsistentes entre o site e o primeiro SaaS, meses depois.
