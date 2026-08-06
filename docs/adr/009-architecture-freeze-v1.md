# ADR 009 — Congelamento da arquitetura v1.0

## Status
Aceito

## Contexto
A fase de definição de arquitetura (ADRs 001–008, `architecture.md`, `design-system.md`, `coding-standards.md`, `roadmap.md`, `product-vision.md`) está concluída e aprovada. O projeto está prestes a entrar em fase de execução: scaffold do monorepo, `packages/ui`, Design System, e então as páginas do site. Sem um ponto de corte explícito, é comum que decisões estruturais continuem sendo revisitadas a cada nova etapa de implementação, gerando instabilidade e retrabalho.

## Decisão
A arquitetura descrita nos ADRs 001–008 é considerada **congelada como versão 1.0** a partir deste documento:

- Nenhuma mudança estrutural (estratégia multi-tenant, fronteiras de módulo, escolha de stack, base do Design System) deve ser feita durante a implementação sem antes: (1) justificar tecnicamente a necessidade, e (2) registrar um novo ADR descrevendo a mudança e por que a v1.0 não é suficiente.
- Ajustes que não alteram a estrutura — adicionar um componente novo ao Design System seguindo o padrão já definido, criar um módulo dentro de uma pasta `verticals/<nome>/` já prevista — não exigem novo ADR: são execução da arquitetura já aprovada, não mudança dela.
- O gatilho para revisitar uma decisão congelada é sempre um caso de uso real encontrado durante a implementação, nunca uma preferência estética ou uma dúvida hipotética levantada sem necessidade concreta.

## Consequências
- A fase de execução (monorepo → `packages/ui` → Design System → páginas do site → primeira SaaS vertical) acontece sobre uma base estável, reduzindo o risco de retrabalho por indecisão estrutural recorrente.
- Toda mudança estrutural real fica documentada e datada em um novo ADR, preservando o histórico de por que a v1.0 evoluiu para v1.1, v2.0, etc.
- Isso não bloqueia correção de bug nem ajuste de implementação dentro do padrão já definido — o congelamento é sobre decisões arquiteturais, não sobre o código em si.
