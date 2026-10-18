# Consentimento de cookies (comportamento real)

Vale para **todos os países e idiomas**. O fuso horário/idioma do navegador **não** influencia mais o consentimento (só sugere o idioma do site).

## Regras implementadas

1. **Antes do aceite:** o script do Google Analytics (`googletagmanager.com`) não está no HTML e não é carregado; não há `gtag`, `dataLayer` de eventos nem cookies de análise. O HTML estático não contém referência ao Google.
2. **Primeira visita:** aparece um aviso (`role="dialog"`) com **Aceitar** e **Recusar** de mesmo destaque visual e link para a Política de Privacidade.
3. **Aceitar:** a decisão (`granted`) é guardada no `localStorage` (`hrtech:consent`); o GA4 é carregado com `analytics_storage` concedido e recursos de publicidade/personalização desligados (`ad_*` negados, `allow_google_signals` e `allow_ad_personalization_signals` falsos). Eventos (`generate_lead`, `whatsapp_click`, `email_click`, `language_change`, `ai_referral`) só são enviados com aceite.
4. **Recusar:** decisão `denied`; o GA não é carregado, `ga-disable-<ID>` fica verdadeiro e o site remove os cookies `_ga`, `_ga_*`, `_gid` e `_gat*` (caminho `/`, no host e nos domínios-pai, com e sem ponto inicial). Outros cookies não relacionados são preservados.
5. **Mudar depois:** link **Preferências de cookies / Cookie preferences / Preferencias de cookies** no rodapé reabre o aviso. Aceitar depois de recusar carrega o GA; recusar depois de aceitar desliga o GA, envia a atualização de consentimento negado e apaga os cookies.
6. **Retorno:** a decisão é lembrada; se for `denied`, a limpeza de cookies roda a cada carga.
7. **Armazenamento bloqueado:** se o `localStorage` falhar, o site funciona e o GA não carrega.

## Limites (ser transparente)

- Só é possível apagar cookies que o JavaScript do próprio site enxerga (não-`HttpOnly`) no domínio do site.
- Dados já enviados ao Google antes de uma recusa seguem a política do Google; a política de privacidade orienta o pedido de exclusão por e-mail.
- O consentimento fica no navegador do visitante; não há registro no servidor (site estático). Se for necessário comprovar o consentimento (prova), isso exige decisão e solução adicionais, a avaliar com advogado.
- Nenhum outro rastreador opcional existe hoje no site. Qualquer novo deve ser carregado apenas dentro de `setConsent('granted')`.

## Arquivos

`lib/analytics.ts` (lógica), `components/i18n/ConsentBanner.tsx`, `ConsentSettingsLink.tsx`, `AnalyticsEvents.tsx`, `components/layout/RootDocument.tsx` (sem script do GA), textos em `content/<idioma>/index.ts` (`consent`) e política em `content/<idioma>/legal.ts` (seção 5).

## Testes

- Vitest: `tests/analytics.test.ts` (detecção/limpeza de cookies, domínios, origem de IA).
- Navegador (Playwright/Chromium, 137 checagens, 0 falhas): PT/EN/ES × desktop 1280 e mobile 390 × `America/Sao_Paulo`, `America/New_York`, `Europe/Madrid`, `Asia/Tokyo`: zero requisições ao Google antes do aceite; botões no idioma da página e com mesmo estilo; banner cabe na tela; recusar limpa cookies; recarregar mantém a decisão; alterar pelo rodapé; retirar o aceite para os eventos; aceite lembrado; `localStorage` bloqueado.
- axe-core: 0 violações em 36 combinações com o aviso exibido a todos.
