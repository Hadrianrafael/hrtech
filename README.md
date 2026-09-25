# HR Tech Sistemas — site institucional

Site institucional da **HR Tech Sistemas**: sites, sistemas web, SaaS, automações e soluções
com Inteligência Artificial. Publicado como site estático no GitHub Pages, com domínio próprio
(`hrtechsistemas.com.br`, ver [`CNAME`](./CNAME)).

Veja também [`REFERENCIAS.md`](./REFERENCIAS.md) — os três sites usados como referência de
qualidade de design antes da reconstrução.

## Tecnologias

- **Next.js 15** (App Router) com **exportação estática** (`output: 'export'`)
- **React 19** + **TypeScript** (strict)
- **Tailwind CSS 3**
- **Vitest** para testes unitários
- **ESLint 9** (flat config, `eslint-config-next`)
- Ícones: SVGs próprios + [Simple Icons](https://simpleicons.org/) (logos de marca)
- Fontes: [Geist](https://vercel.com/font) (sans e mono), self-hosted via `next/font`
- Deploy: **GitHub Actions → GitHub Pages**

Não há backend: o formulário de contato funciona 100% no navegador (abre WhatsApp ou e-mail
com a mensagem pronta), com suporte opcional a um endpoint HTTP externo (veja
[Configurar o formulário de contato](#configurar-o-formulário-de-contato)).

## Como instalar

Requisitos: Node.js 20+ e [pnpm](https://pnpm.io) 9+ (`corepack enable` já resolve).

```bash
pnpm install
```

## Como executar (desenvolvimento)

```bash
pnpm dev
```

Abre em <http://localhost:3000>.

## Como fazer build

```bash
pnpm build
```

Gera a pasta estática `out/` (HTML, CSS, JS e imagens prontos para qualquer hospedagem
estática). Para pré-visualizar o build localmente:

```bash
npx serve out
```

## Verificações (lint, tipos, testes, build)

```bash
pnpm check
```

Roda, em sequência: `eslint`, `tsc --noEmit`, `vitest run` e `next build`. É o mesmo comando
executado no CI (`.github/workflows/ci.yml`) e antes do deploy
(`.github/workflows/deploy.yml`).

Comandos individuais: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.

## Como fazer deploy

O deploy é automático: todo push na branch `main` dispara
[`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml), que roda `pnpm check` e
publica a pasta `out/` no GitHub Pages via Actions.

**Pré-requisito único** (configuração do repositório no GitHub, feita uma vez):
`Settings → Pages → Source` deve estar definido como **GitHub Actions** (não "Deploy from a
branch"). O domínio próprio já está configurado em `Settings → Pages → Custom domain`, e o
arquivo [`CNAME`](./CNAME) na raiz do projeto garante que o domínio seja mantido a cada deploy.

Se o site for publicado num subcaminho (ex.: `usuario.github.io/repositorio`, sem domínio
próprio), defina a variável `NEXT_PUBLIC_BASE_PATH=/repositorio` antes do build — veja
[`.env.example`](./.env.example). Com o domínio próprio atual, essa variável deve ficar vazia.

## Estrutura do projeto

```
app/                  Rotas (App Router) — cada pasta é uma página
  page.tsx              Home (todas as seções de uma página só)
  solucoes/              Listagem e página dinâmica de cada solução (/solucoes/[slug])
  privacidade/, termos/  Páginas institucionais
  sitemap.ts, robots.ts, manifest.ts   Gerados a partir de config/ e data/
components/
  sections/            Seções da Home (Hero, Services, About, Founder, Stack...)
  layout/              Header, Footer, botão do WhatsApp, breadcrumbs
  ui/                   Botão, Section, Reveal (scroll), Tag, Logo etc. (design system)
  icons/                Ícones de linha próprios + logos de marca (Simple Icons)
data/                  Conteúdo do site, separado da interface
  services.ts             As 7 soluções (Sites, Sistemas, SaaS, IA...)
  projects.ts             Estrutura de dados do portfólio — mantida para o futuro (ver abaixo),
                           não está conectada a nenhuma página no momento
  technologies.ts, process.ts, segments.ts, company.ts
config/site.ts         Configuração central: nome, contato, WhatsApp, redes sociais, menu
lib/                   Funções auxiliares (WhatsApp, SEO, validação do formulário, etc.)
public/                Imagens, ícones, favicon
tests/                 Testes unitários (Vitest)
```

Arquitetura pensada para múltiplos arquivos pequenos e coesos, em vez de um único arquivo
gigante — cada seção da Home é um componente próprio em `components/sections/`, e todo o
conteúdo (textos de serviços, tecnologias) fica em `data/`, sem se misturar com JSX.

## Portfólio (desativado por enquanto)

A empresa optou por não divulgar projetos no site por enquanto. A estrutura de dados para um
portfólio (`data/projects.ts` — case com desafio, solução, funcionalidades, galeria e
resultado) foi mantida no repositório para quando fizer sentido reativá-la, mas nenhuma página
ou seção do site está conectada a ela hoje. Reativar exige recriar as páginas `/projetos/` e os
componentes de card/case — peça ajuda quando for a hora.

## Como cadastrar/editar uma solução

Edite `data/services.ts` da mesma forma — cada objeto do array `services` vira automaticamente
um card na Home e uma página em `/solucoes/<slug>/`.

## Como alterar

| O quê | Onde |
|---|---|
| WhatsApp (número e mensagem padrão) | `config/site.ts` → `contact.whatsappNumber` / `whatsappMessage` |
| E-mail de contato | `config/site.ts` → `contact.email` |
| Redes sociais (LinkedIn, Instagram) | `config/site.ts` → `social` |
| Itens do menu | `config/site.ts` → `mainNav` |
| Textos institucionais (Sobre, valores, fundador) | `data/company.ts` |
| Tecnologias exibidas | `data/technologies.ts` |
| Etapas do processo de trabalho | `data/process.ts` |
| Segmentos de mercado | `data/segments.ts` |
| Cores, tipografia, tokens visuais | `app/globals.css` (variáveis `:root`) e `tailwind.config.ts` |
| Foto do fundador | `public/images/founder.webp` (troque o arquivo mantendo o mesmo nome) |

### Configurar o formulário de contato

Por padrão, o formulário monta a mensagem e abre o WhatsApp do visitante com tudo pronto para
enviar (não requer backend). Para usar um serviço de formulários (ex.:
[Formspree](https://formspree.io), Getform, uma função HTTP própria), defina
`contactFormEndpoint` em `config/site.ts` com a URL que aceita `POST` JSON — o formulário passa
a enviar por lá automaticamente, com um botão de fallback por e-mail sempre disponível.

## Testes e verificação visual

Antes de qualquer publicação, este projeto foi verificado com:

- `pnpm check` — lint, TypeScript, testes unitários e build de produção, **todos limpos**.
- Verificação manual em Chromium headless nos breakpoints 375px, 390px, 430px, tablet (820px),
  desktop (1440px) e no menu mobile.
- Checagem de links internos em todas as páginas geradas (0 links quebrados).
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/) no build de produção:
  **Performance 93 · Accessibility 100 · Best Practices 100 · SEO 100**.

## Licença de conteúdo

Textos, identidade visual e código deste site pertencem à HR Tech Sistemas.
