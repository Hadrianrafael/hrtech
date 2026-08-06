# ADR 002 — Monorepo com Turborepo e pnpm

## Status
Aceito

## Contexto
O projeto terá, desde já, dois apps (`web` em Next.js, `api` em NestJS) e pacotes compartilhados (Design System, configuração, tipos). O ecossistema vai crescer para múltiplos apps (painéis por SaaS). Era preciso decidir entre repositórios separados ou um monorepo, e — optando por monorepo — qual ferramenta de orquestração.

## Alternativas consideradas
1. **Repositórios separados** (um para o site, um para a API) — mais isolamento, porém duplica configuração (lint, tsconfig, CI) e dificulta compartilhar o Design System e tipos entre front e back sem publicar pacotes privados.
2. **Monorepo com pnpm workspaces, sem Turborepo** — simples, mas sem cache de build incremental; builds ficam mais lentos conforme o número de apps cresce.
3. **Monorepo com Turborepo + pnpm workspaces** — cache de build/lint/test incremental (só roda o que mudou), boa integração com CI, padrão amplamente usado em monorepos Next.js/NestJS.

## Decisão
Monorepo com **Turborepo + pnpm workspaces** (opção 3). Estrutura: `apps/{web,api}` + `packages/{ui,config,types}`.

## Consequências
- Um único `pnpm install` para todo o projeto; versões de dependência compartilhada centralizadas.
- `packages/types` elimina duplicação de DTOs entre front e back — mudança de contrato de API é refletida nos dois lados pelo compilador.
- CI mais rápido à medida que o projeto cresce, porque o Turborepo não reprocessa o que não mudou.
- Cada app dentro do monorepo continua deployável de forma independente (containers separados) — o monorepo é uma decisão de organização de código, não de deploy.
