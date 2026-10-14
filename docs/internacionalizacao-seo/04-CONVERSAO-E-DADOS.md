# Conversão, portfólio e preços

## Formulário e WhatsApp

Campos: nome, empresa, país, e-mail, telefone/WhatsApp, tipo de serviço, idioma de atendimento, descrição (e faixa de orçamento só em PT, em reais). Textos, validação e mensagem pré-pronta no idioma da página; a mensagem informa o idioma de atendimento. O botão de WhatsApp e os CTAs usam mensagem inicial por idioma (e por segmento nas páginas de segmento).

Sem `contactFormEndpoint` (`config/site.ts`), o envio abre WhatsApp/e-mail do visitante (como antes). Para receber leads estruturados (país, idioma) configure um endpoint (ex.: Formspree) — **pendente de decisão**.

## Preços BRL/USD/EUR

`config/pricing.ts`: estrutura pronta (`pricing`, `formatPrice`), **desativada e vazia**. Nenhum preço inventado, sem conversão cambial e sem cobrança internacional.

## Portfólio

Não foi reativado: o dono removeu o portfólio do site em 25/09/2026 (PR #3). `data/projects.ts` (7 projetos reais, alguns protótipos de demonstração e dois sem capturas) segue sem uso. Para reativar com segurança são necessários: **autorização** para citar cada projeto/cliente, **imagens reais**, link de demonstração e resultados verificáveis (nunca inventados). Quando decidir, o modelo de dados já cobre nome, segmento, problema, solução, tecnologias, imagens e links.
