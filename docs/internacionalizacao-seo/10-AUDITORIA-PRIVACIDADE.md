# Auditoria técnica de privacidade (branch do PR #11)

Escopo: somente o código da branch `claude/sweet-volta-2kaak9`. Método: leitura do código-fonte e do HTML gerado (`out/`). Não é parecer jurídico.

## 1. Dados pessoais que o formulário coleta (`components/sections/ContactForm.tsx`, `lib/contact.ts`)

| Campo | Obrigatório | Observação |
| --- | --- | --- |
| Nome | sim | |
| E-mail | sim | |
| País | sim | lista fixa (Brasil, EUA, Espanha, outro) |
| Tipo de serviço | sim | |
| Idioma de atendimento | sim | |
| Mensagem | sim | texto livre: o visitante pode digitar qualquer dado pessoal |
| Empresa | não | |
| Telefone/WhatsApp | não | |
| Faixa de orçamento | não | só aparece em pt-BR (nas versões EN/ES a lista é vazia) |

Não há campo de CPF, endereço, data de nascimento nem upload. Há um campo invisível anti-spam (`website`), descartado se preenchido.

## 2. Para onde vão os dados e se há armazenamento no site

- O site é estático (GitHub Pages): **não existe servidor nem banco de dados próprio**.
- `contactFormEndpoint` está **vazio**. Então "Enviar" abre `https://wa.me/5511932441699?text=…` (WhatsApp) e "Enviar por e-mail" abre `mailto:contato@hrtechsistemas.com.br`, ambos no dispositivo do visitante. Os dados só chegam à HR Tech quando o visitante envia a mensagem.
- O texto digitado não é gravado em `localStorage`, `sessionStorage` nem cookie (a busca por essas APIs no código mostra apenas: decisão de cookies, idioma escolhido, aviso de idioma dispensado e marca de "já registrei a visita vinda de IA").
- **Se algum dia `contactFormEndpoint` for preenchido**, o formulário passa a enviar JSON a esse serviço de terceiros: a política precisa nomeá-lo antes de publicar (há um teste que falha para lembrar disso).

## 3. Serviços de terceiros que recebem dados

| Serviço | Quando | Dados |
| --- | --- | --- |
| GitHub Pages (hospedagem) | toda visita | dados técnicos de acesso, como IP (comum a qualquer hospedagem). **Não constava na política; incluído nesta etapa.** |
| Google Analytics 4 (`googletagmanager.com`) | **só após aceite** | ver item 4 |
| WhatsApp / Meta (`wa.me`) | quando o visitante clica em enviar ou em links de WhatsApp | a mensagem pré-preenchida (dados do formulário) |
| Provedor de e-mail do visitante e da HR Tech | e-mail enviado pelo visitante | idem |
| Instagram (link no rodapé) | só se o visitante clicar | sai do site; nenhum script do Instagram é carregado |

Verificado no HTML de produção local: os únicos hosts externos referenciados são `wa.me` e `www.instagram.com` (links). Nenhuma fonte, script, imagem ou widget de terceiros é carregado (fontes são locais).

## 4. O que o Google Analytics coleta depois do aceite

Configuração do site: `analytics_storage` concedido; `ad_storage`, `ad_user_data`, `ad_personalization` negados; `allow_google_signals` e `allow_ad_personalization_signals` falsos.

- **Cookies que o GA4 grava**: `_ga` e `_ga_<ID>` (identificador de visitante e de sessão). `_gid` e `_gat*` fazem parte da lista de limpeza por precaução; o gtag.js atual usa em geral `_ga` e `_ga_<ID>`.
- **Eventos enviados pelo site**: visualização de página (automática do GA4), `generate_lead` (parâmetros: método, tipo de serviço, país escolhido, idioma de atendimento, idioma da página), `whatsapp_click`, `email_click`, `language_change`, `ai_referral`.
- **Não são enviados pelo site**: nome, e-mail, telefone, empresa nem texto da mensagem.
- **O que o Google recebe por natureza do GA4** (informação pública do produto; confirmar na documentação atual do Google): endereço IP (usado para localização aproximada), navegador/dispositivo, URL e referência da página. Não consegui testar a coleta real em produção neste ambiente.
- Retenção no lado do Google: configurável no painel do GA4 (Administrador > Coleta e modificação de dados > Retenção de dados). **Verificar o valor configurado; não está no código.**

## 5. Identificação empresarial hoje

- Nome usado no rodapé, nas políticas e em dados estruturados: **"HR Tech Sistemas"** (`legalName` em `config/site.ts`).
- CNPJ: `68.438.436/0001-09`, comentário no código: "CCMEI — HADRIAN RAFAEL SILVA DE OLIVEIRA". Sede citada: Suzano (SP).
- Fundador exibido no site e no JSON-LD: Hadrian Rafael Silva de Oliveira.
- E-mail de contato: `contato@hrtechsistemas.com.br`. WhatsApp: +55 11 93244-1699.
- **Não está confirmado** que "HR Tech Sistemas" seja a razão social/nome fantasia registrado nem como o titular deve constar. Não alterei nada: depende de você e do advogado (A2).

## 6. O que depende de você ou de advogado

Informações suas: ver o checklist final em `09-CHECKLIST-ADVOGADO.md` (seção "O que preciso de você").
Textos que exigem validação jurídica: `content/<idioma>/legal.ts` seções 1 (controlador), 5 (cookies), 6 (prestadores e transferências), 7 (prazo), 8 (direitos), além dos Termos.

## 7. Correções técnicas feitas nesta etapa

1. Link da Política de Privacidade junto ao formulário, nos 3 idiomas.
2. Seção 4 da política: passa a dizer o que o código faz de fato (o site não recebe nem guarda o formulário; o envio é feito pelo visitante via WhatsApp/e-mail).
3. Seção 6: inclui o GitHub (hospedagem) e esclarece que o Google Analytics só atua com aceite.
4. Teste que impede publicar com endpoint externo de formulário sem revisar a política.

## 8. Decisões que exigem advogado (sem sugestão de resposta)

A1 base legal e prazo; A2 identificação do controlador; A4 revisão dos textos nos 3 idiomas; transferência internacional; representante na UE; aplicabilidade de leis dos EUA; prova do consentimento; se a menção ao GitHub como "prestador" está na categoria correta.
