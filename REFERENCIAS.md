# Referências de design

Antes de desenhar o novo site, pesquisei três sites reais de empresas/agências de tecnologia
que desenvolvem sites, sistemas, SaaS e soluções digitais para empresas, para calibrar o nível
de qualidade esperado. **Nenhum código, texto, imagem ou identidade visual foi copiado** — as
referências serviram apenas de parâmetro de qualidade (estrutura, hierarquia, tom).

## 1. Cheesecake Labs — [cheesecakelabs.com](https://cheesecakelabs.com)

Software house especializada em produtos digitais e IA.

**O que observei:**
- Hero direto: uma frase de posicionamento forte + métricas reais logo abaixo do dobra.
- Cards de serviço com copy curta (1–2 frases) e link "saiba mais".
- Cases apresentados como cards grandes com logo do cliente, categoria, headline e 1–2 métricas.
- CTA ("Schedule a call") repetido em vários pontos da página (nav, hero, meio, footer).

**O que aproveitei para a HR Tech:**
- Hero com headline curta e de impacto + métricas logo abaixo (usei métricas reais do próprio
  site — número de soluções, projetos, tecnologias — nunca inventadas).
- Cards de serviço enxutos, com 3 bullets e link para página de detalhe.
- CTA de contato repetido no header, hero e seção final.

## 2. Netguru — [netguru.com](https://netguru.com)

Consultoria/software house de produto digital e engenharia.

**O que observei:**
- Navbar com submenus organizados por categoria de serviço.
- Cases em cards com imagem quadrada, logo do cliente e um label de tipo de serviço.
- Seção de prova social combinando grid de logos de clientes + carrossel de depoimentos.
- Footer extenso, com colunas por categoria (empresa, serviços, clientes) e certificações.

**O que aproveitei para a HR Tech:**
- Footer organizado em colunas temáticas (Soluções, Projetos, Empresa, Contato).
- Cards de projeto com categoria/tag visível (SITE, SISTEMA, SAAS...) e link de case.
- **Não usei depoimentos nem logos de clientes**, pois a HR Tech não possui esse material
  verificável ainda — ao contrário da referência, não simulei prova social inexistente.

## 3. Significa — [significa.co](https://significa.co)

Estúdio de design e desenvolvimento de produtos digitais.

**O que observei:**
- Tipografia grande e ousada, muito espaço em branco, hierarquia clara.
- Projetos em destaque logo após o hero, com imagem cheia e descrição curta.
- Tom editorial: menos "vendas", mais "isto é o que fazemos e como pensamos".

**O que aproveitei para a HR Tech:**
- Tipografia com hierarquia forte (headline grande, tracking negativo) e bastante respiro entre
  seções.
- Projetos como elemento central da Home, logo após a apresentação das soluções.
- Tom direto no texto em português, evitando jargão de marketing genérico.

## Decisões de UX/UI definidas a partir dessas referências

- **Dark mode premium** como padrão, com azul como cor de destaque — não neon, sutil.
- **Hero** com headline curta + prova (métricas reais) + visual ilustrativo de produto/dashboard.
- **Cards de serviço** enxutos, com número, ícone, 3 bullets e link "ver detalhes".
- **Portfólio** como cards grandes, com tags de categoria, tecnologias e link para case
  completo (desafio → solução → funcionalidades → galeria → resultado).
- **Prova social nunca fabricada**: nenhuma métrica, cliente, depoimento ou "anos de mercado"
  foi inventado — quando a informação não existe, o site mostra um aviso claro em vez de
  simular.
- **Footer** com colunas temáticas + redes sociais + copyright dinâmico.
- **Animações discretas**: entrada suave no scroll, hover em cards, respeitando
  `prefers-reduced-motion`.
