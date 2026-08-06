# ADR 004 — Clean Architecture no back-end

## Status
Aceito

## Contexto
O back-end vai crescer de "um site institucional com um formulário de contato" para múltiplos produtos SaaS com regras de negócio próprias. Regras de negócio acopladas diretamente ao NestJS ou ao Prisma tornam mais caro reaproveitá-las quando um novo produto (ou uma nova forma de expor a mesma regra, como uma API pública) precisar da mesma lógica.

## Decisão
Cada módulo de domínio em `apps/api/src/modules/**` segue quatro camadas:

```
modules/<nome>/
├── domain/          # entidades e regras de negócio puras — sem NestJS, sem Prisma
├── application/     # use cases — orquestram domain + repositórios via interface
├── infrastructure/  # implementação dos repositórios (Prisma), integrações externas
└── presentation/    # controllers, DTOs, validação de entrada
```

Regra de dependência: `domain/` nunca importa de `infrastructure/` nem de bibliotecas de framework. `application/` depende de `domain/` e de *interfaces* de repositório (não da implementação Prisma diretamente — inversão de dependência via injeção do NestJS).

## Consequências
- Regras de negócio de `core/auth` e `core/users` são reaproveitáveis quando o primeiro SaaS vertical for criado, trocando só `infrastructure/` se a fonte de dados mudar.
- Testes de `domain/` e `application/` não precisam de banco de dados nem de mocks pesados de framework — são testes unitários rápidos e diretos.
- Custo: mais arquivos e mais indireção do que um CRUD direto controller→Prisma. Aceito conscientemente porque o projeto é desenhado para múltiplos produtos, não para um único CRUD descartável.
- Módulos triviais (ex: `website/contact`, que só salva uma mensagem e dispara um e-mail) seguem a mesma estrutura por consistência, mesmo com `application/` enxuta — a convenção vale mais que a economia de um módulo pequeno divergir do padrão.
