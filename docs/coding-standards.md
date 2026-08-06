# Padrões de Código — HR Tech

## Nomenclatura de arquivos

- Componentes React: `PascalCase.tsx` (`ProjectCard.tsx`)
- Hooks: `useCamelCase.ts` (`useTenantContext.ts`)
- Módulos NestJS e arquivos utilitários: `kebab-case.ts` (`tenant-context.middleware.ts`)
- Testes: mesmo nome do arquivo testado + `.spec.ts` (unit) ou `.e2e.spec.ts` (E2E)
- Uma exportação principal por arquivo — evita arquivos com múltiplas responsabilidades não relacionadas

## Convenções de código

- TypeScript estrito (`strict: true`) em todo o monorepo — sem `any` não justificado
- Nada de comentário explicando *o quê* o código faz (nomes bons já explicam); comentário só quando o *porquê* não é óbvio (uma decisão não intuitiva, um workaround de bug específico)
- Sem abstração especulativa: três linhas parecidas são melhores que uma abstração prematura para um caso hipotético
- Back-end: toda regra de negócio em `domain/`, nunca em `controller` ou `service` de infraestrutura — ver `architecture.md`
- Front-end: Server Component é o padrão; `"use client"` só quando há interatividade real (estado, evento, animação)
- Nenhum dado (cliente, case, métrica) inventado em nenhuma camada — nem em fixture de exemplo que possa vazar para conteúdo real

## Estrutura de módulos

Todo módulo novo no back-end segue a estrutura `domain/application/infrastructure/presentation` descrita em `architecture.md`. Todo módulo novo no front-end segue a organização por feature (`website/<feature>`, e futuramente `verticals/<nome>/<feature>`), nunca por tipo de arquivo (evitar pastas globais `components/`, `hooks/` genéricas competindo com a organização por feature).

## Commits

Formato: [Conventional Commits](https://www.conventionalcommits.org/).

```
<tipo>(<escopo opcional>): <descrição curta, no imperativo>

[corpo opcional explicando o porquê]
```

Tipos usados: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `ci`. Escopo é o módulo ou app afetado (`feat(auth): ...`, `fix(web/contact): ...`).

## Branches

- `main` — sempre deployável
- `feature/<descrição-curta>` — uma feature ou etapa por branch
- Merge para `main` via Pull Request, mesmo trabalhando sozinho — mantém histórico de revisão e CI rodando antes de integrar

## Testes

- Vitest para unit tests (obrigatório para `core/auth`, `core/tenants` e a Prisma Client Extension de isolamento — a parte que não pode falhar silenciosamente)
- Playwright para E2E de fluxos críticos (ex: envio do formulário de contato)
- Teste acompanha a mudança que o motivou, no mesmo Pull Request — não é uma etapa separada posterior
