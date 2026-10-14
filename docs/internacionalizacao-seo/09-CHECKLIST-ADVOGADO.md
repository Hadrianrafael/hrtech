# Checklist para o advogado (A1, A2, A4)

> Lista de **informações e decisões a confirmar**. Não contém parecer nem bases legais ou prazos sugeridos: tudo abaixo é pergunta ou dado de fato. Texto atual das políticas: `content/<idioma>/legal.ts`.

## Fatos para levar à consulta

- Site institucional estático, sem login nem banco de dados próprio; público-alvo em Brasil, EUA e Espanha (pt-BR, en-US, es-ES).
- Dados pessoais coletados: **formulário de contato** (nome, empresa opcional, país, e-mail, WhatsApp/telefone opcional, tipo de serviço, orçamento opcional, idioma, descrição) enviado por WhatsApp ou e-mail abertos no dispositivo do visitante; **Google Analytics 4**, somente após aceite (ver `08-CONSENTIMENTO-DE-COOKIES.md`).
- Prestadores citados: Google (Analytics), Meta (WhatsApp), provedor de e-mail.
- Armazenamento no navegador: idioma escolhido e decisão sobre cookies.
- Controlador citado hoje: "HR Tech Sistemas, CNPJ …, Suzano (SP)"; e-mail de contato para privacidade.

## A1 — Base legal e prazo de guarda

Informações a reunir:
1. Onde os dados do formulário ficam depois do envio (caixa de e-mail, histórico do WhatsApp, CRM/planilha)? Quem tem acesso?
2. Por quanto tempo o negócio realmente os mantém hoje, e se há rotina de exclusão.
3. Há uso além de responder ao contato (newsletter, remarketing, prospecção)? Hoje o texto diz que não.

Decisões do advogado:
4. Qual base legal aplicar, por finalidade, na LGPD (Brasil) e, para visitantes europeus, no RGPD (Espanha): formulário de contato e Google Analytics.
5. Prazo(s) de guarda a declarar para cada categoria (formulário; dados de análise) e se há prazo legal aplicável.
6. Redação final da seção de base legal e de prazos nos três idiomas.

## A2 — Identidade do controlador

Informações a reunir:
1. Natureza do CNPJ (CCMEI/MEI em nome de Hadrian Rafael Silva de Oliveira) e nome empresarial/fantasia exatos.
2. Endereço que pode ser divulgado; e-mail e telefone oficiais de privacidade.
3. Se existe encarregado (DPO) ou apenas o canal por e-mail.

Decisões do advogado:
4. Como identificar o responsável nos documentos e no rodapé (nome empresarial, nome fantasia, titular).
5. Se um microempreendedor precisa designar encarregado ou se o canal de contato basta.
6. Se é necessário representante na UE/Reino Unido (RGPD art. 27) ou se há isenção.

## A4 — Revisão jurídica dos textos

1. Revisão da **Política de Privacidade** e dos **Termos de Uso** em pt-BR, en-US e es-ES por advogado habilitado (ou um por jurisdição).
2. Pontos já identificados para opinião: mecanismo de transferência internacional (dados tratados no Brasil e pelo Google nos EUA); aplicabilidade de leis estaduais dos EUA (ex.: CCPA/CPRA) e a frase "não vendemos nem compartilhamos dados"; termos sem lei aplicável, foro e limitação de responsabilidade; cláusula "prevalece a versão em português".
3. Confirmar se o **aviso de cookies atual** (aceitar/recusar de mesmo destaque, consentimento prévio, link para mudar a escolha, remoção dos cookies controláveis) atende RGPD/LSSI-CE (Espanha), LGPD e, se aplicável, leis dos EUA; e se há necessidade de registrar a prova do consentimento.
4. Conferir as menções a regras de publicidade da advocacia (Provimento 205/2021 da OAB; normas espanholas) nas páginas do segmento.
5. Revisão editorial por falantes nativos EN/ES (não jurídica).

Saída esperada: textos aprovados por idioma, para substituir os de `legal.ts` e atualizar a data "Última atualização".

## O que preciso de você (para concluir e publicar)

Respostas curtas bastam; eu aplico no código e nos 3 idiomas.

1. **Nome a exibir como responsável** (rodapé, políticas, dados estruturados): razão social exata e/ou nome fantasia, e se o nome do titular deve aparecer. Hoje: "HR Tech Sistemas".
2. **Confirmação do CNPJ** `68.438.436/0001-09` e da cidade (Suzano/SP) como dados públicos a manter.
3. **Canal oficial de privacidade**: manter `contato@hrtechsistemas.com.br`? Existe encarregado (DPO)? Nome e contato, se houver.
4. **Destino real dos dados do formulário**: em qual caixa de e-mail/WhatsApp/planilha/CRM eles ficam, quem acessa, e por quanto tempo vocês os mantêm hoje na prática (fato, não recomendação).
5. **Retenção do Google Analytics**: valor configurado no painel do GA4 (Administrador > Coleta de dados > Retenção).
6. **Provedor de e-mail** usado pela empresa (nome), para constar como prestador.
7. **Decisão sobre o formulário**: manter via WhatsApp/e-mail (sem servidor) ou contratar um serviço de recebimento (nesse caso, nome do prestador e política revisada).
8. **Textos aprovados pelo advogado** (política e termos em pt-BR, en-US, es-ES) ou, se preferir publicar antes, **autorização por escrito** para publicar com A1, A2 e A4 em aberto, ciente do risco.
9. **Acesso ao domínio**: confirmar que `https://hrtechsistemas.com.br` abre com HTTPS (meu ambiente não alcança o domínio) ou liberar o acesso.
