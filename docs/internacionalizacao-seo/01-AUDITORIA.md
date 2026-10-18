# Fase A — Descoberta e auditoria

Data: 11/10/2026. Escopo: site institucional `https://hrtechsistemas.com.br`.

> Documentação mantida no repositório porque o Obsidian não estava acessível nesta sessão.
> **Sincronização com o Obsidian: pendente.**

## 1. Repositório do site

**Conclusão:** o site institucional é a **raiz** do repositório
[`Hadrianrafael/hrtech`](https://github.com/Hadrianrafael/hrtech) (branch principal `main`).

O mesmo repositório também contém o **HR Tech Omni** em [`apps/platform/`](../../apps/platform), com
dependências, lockfile e CI próprios (`Platform CI`). O HR Tech Gestão fica em outro repositório
(`Hadrianrafael/hrtech-saas`). Os três projetos são independentes.

| Evidência | Resultado |
| --- | --- |
| Arquivo `CNAME` na raiz | `hrtechsistemas.com.br` |
| Deployments do ambiente `github-pages` | último em 07/10/2026, commit `fb5ccce` (HEAD da `main`), `environment_url: http://hrtechsistemas.com.br/` |
| Workflow `Deploy to GitHub Pages` | roda em todo push na `main` (`pnpm check` → publica `out/`) |
| Search Console | meta de verificação do Google em `app/layout.tsx` (PR #5) |
| GA4 | `G-B9NPFJ0FP5` em `config/site.ts` |
| Outros candidatos verificados | `agencia-sites` (monorepo NestJS/Next sem referência ao domínio) e `Portfolio` (currículo pessoal em HTML). Nenhum tem `CNAME` nem cita `hrtechsistemas.com.br` |

Um domínio próprio do GitHub Pages só pode estar ligado a um repositório por vez, o que, junto com os
deployments acima, confirma a correspondência.

**Limitação:** a política de rede deste ambiente bloqueia `hrtechsistemas.com.br` (HTTP 403 no proxy), então
não foi possível baixar o HTML publicado para compará-lo byte a byte. A correspondência foi confirmada pelos
deployments do GitHub.

## 2. Tecnologia e publicação

- Next.js 15 (App Router) com `output: 'export'` (site 100% estático), React 19, TypeScript strict,
  Tailwind CSS 3, Vitest, ESLint 9. Node 20, pnpm 9.
- Hospedagem: GitHub Pages com domínio próprio. Não há servidor, middleware nem funções de borda.
- Não há integração da Vercel nem do Azure ativa para o site:
  - os únicos ambientes de deployment são `github-pages` e `production`;
  - `production` é o antigo pipeline do Azure Container Apps (último deploy em 18/09/2026), removido do código
    em 25/09/2026 quando o site foi reconstruído;
  - o `apps/platform/vercel.json` é do HR Tech Omni (projeto separado na Vercel, com *Root Directory*
    `apps/platform`) e não publica o site.

### Riscos de infraestrutura encontrados

1. **Publicação dupla no GitHub Pages.** No push de 07/10, rodaram dois deploys para o mesmo commit:
   - `pages build and deployment` (build Jekyll legado, *Deploy from a branch*), concluído às 11:38:38;
   - `Deploy to GitHub Pages` (workflow do Next.js), concluído às 11:39:04.

   O site certo está no ar porque o workflow do Next.js terminou por último. Se a ordem se inverter, o
   GitHub Pages passa a servir o build Jekyll da raiz do repositório no lugar do site.
   **Recomendação:** em *Settings → Pages → Build and deployment → Source*, selecionar **GitHub Actions**
   (o README já pede isso). A API de configuração do Pages não está acessível nesta sessão, então não foi
   possível conferir nem alterar.
2. **HTTPS.** O `environment_url` do deploy aparece como `http://`. Conferir em *Settings → Pages* se
   **Enforce HTTPS** está marcado.
3. **Cabeçalhos de segurança.** O GitHub Pages não permite cabeçalhos HTTP personalizados (CSP, HSTS
   próprio, `X-Frame-Options`). Para isso seria preciso um proxy/CDN na frente (por exemplo, Cloudflare).

### Pushes e deploy

- Push em qualquer branch diferente de `main` **não publica** o site: o deploy só roda em push na `main`, e o
  build legado do Pages só observa a branch configurada (`main`).
- Pull requests disparam apenas o `CI` (lint, typecheck, testes e build), sem publicar.
- O `Platform CI` só roda quando há mudança em `apps/platform/**`.

## 3. Auditoria de SEO (estado antes desta etapa)

| Item | Situação |
| --- | --- |
| Idiomas | Só português; `<html lang="pt-BR">` |
| `hreflang` | Inexistente |
| Canonical | Correto e autorreferente nas páginas; o `404.html` aponta o canonical para a Home |
| `robots.txt` | `User-Agent: * / Allow: /` + sitemap — libera todos os robôs |
| Sitemap | 11 URLs, sem alternâncias de idioma; inclui páginas `noindex` (privacidade/termos); `lastmod` muda a cada build (data do build, não do conteúdo) |
| Títulos | Bons na Home; nas soluções, curtos e pouco descritivos (ex.: "Sites \| HR Tech Sistemas") |
| Dados estruturados | `Organization` + `ProfessionalService` + `WebSite` (global), `Service` e `BreadcrumbList` nas soluções |
| Renderização | HTML estático completo, conteúdo indexável sem JavaScript |
| Páginas comerciais | 7 soluções; nenhuma página por segmento de mercado; sem FAQ |
| Imagem de compartilhamento | `og.png` só em português |
| Portfólio | Retirado do ar em 25/09/2026 (PR #3); `data/projects.ts` mantido sem uso |
| Medição | GA4 sem eventos de conversão nem identificação de visitas vindas de assistentes de IA |
| Privacidade | GA4 carregava sem consentimento (estado original, já corrigido: ver `08-CONSENTIMENTO-DE-COOKIES.md`) |

Desempenho medido pelo autor anterior (README): Lighthouse Performance 93, Accessibility 100,
Best Practices 100, SEO 100.

## 4. Melhorias definidas

1. Três versões completas: pt-BR na raiz (URLs atuais preservadas), `/en-us/` e `/es-es/` com slugs no
   idioma de cada mercado.
2. `hreflang` recíproco, canonical por idioma, sitemap multilíngue e `<html lang>` correto no HTML estático.
3. Seletor de idioma, sugestão automática (idioma do navegador + fuso horário como indicador aproximado de
   país, usado só para sugerir o idioma, nunca para decidir cookies) e preferência manual que prevalece, **sem redirecionar robôs**.
4. Páginas por segmento: hotelaria e pousadas, energia solar, clínicas veterinárias, escritórios de advocacia,
   construção civil e reformas.
5. FAQ útil na Home, nas soluções e nos segmentos; dados estruturados correspondentes.
6. Formulário com país, tipo de serviço e idioma de atendimento; mensagens de WhatsApp por idioma.
7. Medição: eventos de lead, troca de idioma e visitas vindas de assistentes de IA; GA4 só após consentimento explícito, em qualquer país.
8. Correções: sitemap sem páginas `noindex`, `lastmod` estável, títulos descritivos, `og.png` por idioma.
