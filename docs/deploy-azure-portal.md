# Deploy — HR Tech pelo Azure Portal (sem CLI)

Passo a passo usando só a interface web do Azure. Nada aqui muda o código,
a arquitetura, o Docker ou a configuração de produção — é só o caminho de
publicação.

## Checklist de prontidão para produção (já verificado)

| Item | Status |
|---|---|
| Dockerfile do frontend (`apps/web/Dockerfile`) | ✅ Multi-stage, build standalone do Next.js, porta 3000 |
| Dockerfile do backend (`apps/api/Dockerfile`) | ✅ Multi-stage, `prisma generate` + build, porta 3001 |
| Variáveis de ambiente | ✅ Documentadas em `apps/api/.env.example` e `apps/web/.env.example` |
| Build de produção do Next.js | ✅ `output: 'standalone'`, compila e gera as 15 rotas |
| Build de produção do NestJS | ✅ `nest build` → `dist/main.js` |
| Prisma | ✅ Schema sem modelos ainda — `DATABASE_URL` não é obrigatória (a API funciona sem banco, só desabilita o que dependeria dele) |
| Portas | ✅ Frontend: **3000** · Backend: **3001** |
| Comunicação frontend → backend | ✅ `apps/web/app/api/contact/route.ts` chama `API_URL` do lado do servidor — o navegador do visitante nunca acessa a API diretamente |
| CORS | ✅ Configurado via `CORS_ORIGIN` em `apps/api/src/main.ts` |
| URLs de produção | ✅ `hrtechsistemas.com.br` já configurado em `lib/site-config.ts` |
| Health check | ✅ `GET /health/live` (liveness, sem dependências) e `GET /health/ready` (readiness) |
| `.dockerignore` | ✅ Já existe na raiz do projeto |

Nada precisou ser alterado — o projeto já estava pronto para este deploy.

---

## PASSO 1 — Subir o código para o GitHub

O Azure Container Registry builda a imagem Docker puxando o código direto
de um repositório Git — sem isso, não tem como buildar pela interface web.

1. Abra o **GitHub Desktop**.
2. `File → Add Local Repository` → selecione a pasta do projeto
   (`C:\Users\hadri\Projects\hrtech-site`).
3. `Publish repository` — dê o nome (ex: `hrtech-site`) e marque como
   **privado** (o código não precisa ser público).
4. Confirme que o push terminou (o GitHub Desktop mostra "Last fetched just now").

## PASSO 2 — Entrar no Azure Portal

Acesse **portal.azure.com** e faça login com a conta que tem a assinatura
ativa.

## PASSO 3 — Criar o Resource Group

1. Barra de busca no topo → **"Resource groups"** → **+ Create**.
2. Assinatura: a sua. Nome: `rg-hrtech`. Região: **Brazil South**.
3. **Review + create** → **Create**.

## PASSO 4 — Criar o Azure Container Registry

1. Busca → **"Container registries"** → **+ Create**.
2. Resource group: `rg-hrtech`. Nome do registro: algo único (ex: `hrtechacr`).
3. Local: **Brazil South**. SKU: **Basic** (suficiente para este projeto).
4. **Review + create** → **Create**.

## PASSO 5 — Configurar deploy contínuo via GitHub Actions

> **Atualização:** o wizard "Quick Task from Git repo" do Container Registry
> (que este passo descrevia antes) não existe mais no Portal atual. O caminho
> que funciona hoje — e que continua sem depender do Azure CLI local — é
> GitHub Actions: o build roda nos runners do próprio GitHub, autenticado
> com um Service Principal, e usa `az acr build` (build remoto na ACR, sem
> Docker local) por trás.

O workflow já está pronto no repositório em `.github/workflows/deploy.yml`
(chama `.github/workflows/ci.yml` primeiro — lint, typecheck, test, build,
e2e — e só builda/publica se tudo passar). Falta só autorizar o GitHub a
falar com a sua assinatura Azure:

1. No Portal, busca → **"App registrations"** → **+ New registration**.
   Nome: `hrtech-github-deploy` (ou o que preferir). **Register**.
2. Dentro do App Registration → **Certificates & secrets** → **+ New client
   secret** → copie o **Value** assim que aparecer (some depois de sair da
   tela).
3. Anote também, na página **Overview** do App Registration: **Application
   (client) ID**, **Directory (tenant) ID**, e a **Subscription ID** (na
   página da sua assinatura).
4. Busca → **"Resource groups"** → `rg-hrtech` → **Access control (IAM)** →
   **Add role assignment** → role **Contributor** (aba "Privileged
   administrator roles") → **Members**: "User, group, or service principal"
   → selecione `hrtech-github-deploy` → **Review + assign**.
5. No GitHub, no repositório → **Settings → Secrets and variables →
   Actions → New repository secret**, crie:

   | Secret | Valor |
   |---|---|
   | `AZURE_CREDENTIALS` | JSON no formato `{"clientId": "...", "clientSecret": "...", "subscriptionId": "...", "tenantId": "..."}` com os valores do passo 3 |
   | `AZURE_ACR_NAME` | nome do registro criado no Passo 4 (ex: `hrtechsistemasacr`) |
   | `AZURE_RESOURCE_GROUP` | `rg-hrtech` |
   | `AZURE_API_APP_NAME` | `hrtech-api` |
   | `AZURE_WEB_APP_NAME` | `hrtech-web` |

Esses valores (exceto `AZURE_CREDENTIALS`) não são segredos sensíveis, mas
ficam no mesmo lugar por consistência com o workflow. **Nunca cole a
connection string ou o client secret em nenhum outro lugar** — só aqui, no
formulário de secrets do próprio GitHub.

As imagens ainda não existem na ACR neste ponto — elas só são criadas na
primeira vez que o workflow rodar (Passo 9). Os Container Apps dos Passos 7
e 8 usam uma imagem pública de bootstrap só para o recurso poder ser criado;
o workflow substitui automaticamente pela imagem real.

## PASSO 6 — Criar o Container Apps Environment

1. Busca → **"Container Apps"** → **+ Create**.
2. Na primeira aba ele pede pra criar o **Container Apps Environment** junto
   — resource group `rg-hrtech`, nome `hrtech-env`, região **Brazil South**.

## PASSO 7 — Criar o Container App do backend (api), com imagem de bootstrap

O workflow do GitHub Actions só consegue atualizar um Container App que já
existe — então este passo cria o recurso com uma imagem pública qualquer
(o "hello world" da Microsoft), e o Passo 9 substitui pela imagem real.

1. **+ Create** → **Container App name**: `hrtech-api`. **Environment**:
   o environment criado no Passo 6.
2. Aba **Container**:
   - **Use quickstart image**: desmarcado (queremos controlar a imagem manualmente).
   - **Image source**: **Docker Hub or other registries** → **Public**.
   - **Registry login server**: `mcr.microsoft.com`. **Image and tag**:
     `k8se/quickstart:latest`.
   - **CPU/Memory**: qualquer combinação válida (ex: 0.5 vCPU / 1 Gi).
3. Aba **Ingress**:
   - **Ingress**: ativado.
   - **Ingress traffic**: **Limited to Container Apps Environment** (interno — o
     navegador do visitante nunca precisa acessar a API diretamente).
   - **Target port**: **3001**.
4. **Review + create** → **Create**.

## PASSO 8 — Criar o Container App do frontend (web), com imagem de bootstrap

1. **+ Create** de novo. **Name**: `hrtech-web`. **Environment**: o mesmo do Passo 7.
2. Aba **Container**: mesma configuração de imagem pública do Passo 7
   (`mcr.microsoft.com` / `k8se/quickstart:latest`).
3. Aba **Ingress**:
   - **Ingress traffic**: **Accepting traffic from anywhere** (este precisa
     ser público).
   - **Target port**: **3000**.
4. **Review + create** → **Create**.

Depois de criado, se quiser já deixar a variável `API_URL` configurada:
**Application → Containers → Environment variables** → `API_URL` = URL
interna do `hrtech-api` (copie de `hrtech-api` → **Overview** →
**Application Url**, algo como
`https://hrtech-api.internal.<sufixo>.brazilsouth.azurecontainerapps.io`) →
**Save as a new revision**.

## PASSO 9 — Autorizar os Container Apps a puxar da ACR (identidade gerenciada)

A ACR é privada — sem isso, o `az containerapp update` do workflow falha
com `UNAUTHORIZED` ao tentar trocar a imagem de bootstrap pela real.

1. Em cada Container App (`hrtech-api` e `hrtech-web`) → **Settings → Security → Identity** → aba **System assigned** → **Status: On** → **Save**.

   > Se o toggle voltar para "Off" sozinho depois de salvar: o Container App
   > provavelmente está com uma revisão travada em "Failed" (por exemplo, de
   > uma tentativa anterior de imagem inválida). Vá em **Application →
   > Containers**, mude qualquer valor (ex: Memory de 1 para 1.5 Gi, ajustando
   > o CPU junto para manter uma combinação válida) e clique **Save as a new
   > revision** para forçar uma revisão saudável — isso destrava o recurso e
   > o Identity volta a salvar normalmente.

2. No Container Registry (`hrtechsistemasacr`) → **Access control (IAM)** →
   **Add role assignment** → role **AcrPull** (aba "Job function roles") →
   **Members**: **Managed identity** → **Select members** → tipo **Container
   App** → selecione `hrtech-api` **e** `hrtech-web` → **Review + assign**.

## PASSO 10 — Disparar o primeiro deploy real

1. Qualquer push em `main` dispara o workflow automaticamente. Para disparar
   manualmente sem esperar um commit: no GitHub, **Actions → Deploy to Azure
   Container Apps → Run workflow**.
2. Acompanhe a execução: primeiro o job `ci` (lint, typecheck, test, build,
   e2e), depois `deploy` (`az acr build` das duas imagens seguido de
   `az containerapp registry set` + `az containerapp update` para cada app).
3. Se `deploy` falhar com `UNAUTHORIZED` ao puxar a imagem, volte ao Passo 9
   — a identidade ou o `AcrPull` não foram configurados corretamente.

## PASSO 11 — Configurar health probes (opcional, recomendado)

Em cada Container App → **Health probes** (na aba Container, ou no menu
lateral depois de criado):

- **api**: Liveness → `GET /health/live`. Readiness → `GET /health/ready`.
- **web**: Liveness/Readiness → `GET /` (o Next.js responde 200 na home).

## PASSO 12 — Testar

1. Abra o Container App `hrtech-web` → **Overview** → clique na
   **Application Url** pública. O site deve carregar com o conteúdo real
   (não mais o "hello world" de bootstrap).
2. Teste o formulário de contato em `/contato` — se as variáveis de e-mail
   não foram configuradas, ele deve mostrar o erro amigável de "não foi
   possível enviar" (a API responde 503 de propósito), não travar.
3. Para ver logs: Container App → menu lateral → **Log stream** (tempo real)
   ou **Logs** (consultas mais elaboradas via Log Analytics).
4. Todo push subsequente em `main` builda e publica automaticamente — não
   precisa mexer em revisão manualmente.

## PASSO 13 — Domínio customizado (hrtechsistemas.com.br)

1. No Container App `hrtech-web` → **Custom domains** → **+ Add custom domain**.
2. Ele vai pedir para você criar, no seu provedor de DNS:
   - Um registro **TXT** (`asuid.hrtechsistemas.com.br`) para provar que o
     domínio é seu.
   - Um registro **CNAME** apontando `hrtechsistemas.com.br` (ou `www`) para
     a Application Url do Passo 12.
3. Depois que o DNS propagar, volte na mesma tela e clique **Validate** →
   **Add**.
4. Para HTTPS: na mesma tela de **Custom domains**, **Add certificate** →
   **Managed certificate** (a Azure emite e renova automaticamente).

## Formulário de contato funcionando de verdade (opcional, quando quiser)

1. Busca → **"Communication Services"** → **+ Create** → nome
   `hrtech-acs`, resource group `rg-hrtech`, **Data location: Brazil**.
2. Dentro do recurso → **Email** → crie um **Email Communication Service**,
   adicione o domínio `hrtechsistemas.com.br` (ou use o domínio gerenciado
   da Azure pra testar rápido primeiro) e siga a verificação DNS que ele pedir.
3. Depois de verificado, volte no `hrtech-acs` → **Keys** → copie a
   **Connection String**.
4. No Container App `hrtech-api` → **Environment variables**, adicione
   `AZURE_COMMUNICATION_CONNECTION_STRING` (cole a connection string) e
   `CONTACT_SENDER_EMAIL` (o remetente verificado) → salve, o que cria
   automaticamente uma nova revisão.

## Quando algo depender só do CLI

Se em algum momento você esbarrar numa tela do Portal que só oferece um
botão "Open Cloud Shell" ou similar: isso ainda é Azure CLI, só que rodando
dentro do navegador, autenticado com a sua sessão do Portal — evita o
problema de login local que você teve, mas ainda é linha de comando. Se
preferir continuar 100% sem digitar comando nenhum, me avise em qual tela
isso aconteceu que eu procuro o caminho equivalente por formulário.
