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

## PASSO 5 — Buildar as imagens direto do GitHub (sem Docker local, sem CLI)

Dentro do Container Registry recém-criado:

1. Menu lateral → **Tasks** → **+ Add** → **Quick task** (ou "Git repository",
   dependendo da versão do Portal).
2. **Source**: escolha **Git repository**, cole a URL do repositório que
   você publicou no Passo 1.
3. **Dockerfile**: `apps/web/Dockerfile` — **Image name**: `hrtech-web:latest`.
4. Rode a task (**Run** ou **Trigger now**). Acompanhe o log na própria tela.
5. Repita criando uma segunda task: **Dockerfile**: `apps/api/Dockerfile` —
   **Image name**: `hrtech-api:latest`.

Depois de rodar as duas, confira em **Repositories** que `hrtech-web` e
`hrtech-api` aparecem com a tag `latest`.

> Se o Portal não oferecer "Git repository" como origem na versão que você
> está vendo, procure por **"Tasks" → "Add" → "Task"** (não "Quick task") —
> esse fluxo sempre pede uma URL de repositório Git como gatilho.

## PASSO 6 — Criar o Container Apps Environment

1. Busca → **"Container Apps"** → **+ Create**.
2. Na primeira aba ele pede pra criar o **Container Apps Environment** junto
   — resource group `rg-hrtech`, nome `hrtech-env`, região **Brazil South**.

## PASSO 7 — Criar o Container App do backend (api)

Ainda no assistente de criação (ou **+ Create** de novo, se já saiu dele):

1. **Container App name**: `hrtech-api`. **Environment**: `hrtech-env`.
2. Aba **Container**:
   - **Image source**: Azure Container Registry.
   - **Registry**: o que você criou no Passo 4. **Image**: `hrtech-api`. **Tag**: `latest`.
   - **CPU/Memory**: 0.5 vCPU / 1 Gi (suficiente para o tráfego inicial).
3. Aba **Ingress**:
   - **Ingress**: ativado.
   - **Ingress traffic**: **Limited to Container Apps Environment** (interno — o
     navegador do visitante nunca precisa acessar a API diretamente).
   - **Target port**: **3001**.
4. Aba **Environment variables** — adicione:

   | Nome | Valor |
   |---|---|
   | `NODE_ENV` | `production` |
   | `PORT` | `3001` |
   | `CORS_ORIGIN` | `https://hrtechsistemas.com.br` |
   | `CONTACT_RECIPIENT_EMAIL` | `contato@hrtechsistemas.com.br` |

   (Deixe `AZURE_COMMUNICATION_CONNECTION_STRING` e `CONTACT_SENDER_EMAIL` de
   fora por enquanto — sem elas o formulário de contato responde 503 de
   propósito, em vez de fingir que enviou. Você adiciona depois de criar o
   recurso de e-mail, se quiser isso funcionando.)

5. **Review + create** → **Create**.

## PASSO 8 — Criar o Container App do frontend (web)

1. **+ Create** de novo. **Name**: `hrtech-web`. **Environment**: `hrtech-env`.
2. Aba **Container**:
   - **Image**: `hrtech-web`, tag `latest`, mesmo registry.
3. Aba **Ingress**:
   - **Ingress traffic**: **Accepting traffic from anywhere** (este precisa
     ser público).
   - **Target port**: **3000**.
4. Aba **Environment variables**:

   | Nome | Valor |
   |---|---|
   | `NODE_ENV` | `production` |
   | `API_URL` | a **URL interna** do `hrtech-api` (veja abaixo) |

   Para pegar a URL interna do `hrtech-api`: abra o Container App `hrtech-api`
   já criado → **Overview** → copie o campo **Application Url** (algo como
   `hrtech-api.internal.<algo>.brazilsouth.azurecontainerapps.io`) e use
   `http://` na frente (não `https`, tráfego interno não usa TLS).

5. **Review + create** → **Create**.

## PASSO 9 — Configurar health probes (opcional, recomendado)

Em cada Container App → **Health probes** (na aba Container, ou no menu
lateral depois de criado):

- **api**: Liveness → `GET /health/live`. Readiness → `GET /health/ready`.
- **web**: Liveness/Readiness → `GET /` (o Next.js responde 200 na home).

## PASSO 10 — Testar

1. Abra o Container App `hrtech-web` → **Overview** → clique na
   **Application Url** pública. O site deve carregar.
2. Teste o formulário de contato em `/contato` — se as variáveis de e-mail
   não foram configuradas, ele deve mostrar o erro amigável de "não foi
   possível enviar", não travar.
3. Para ver logs: Container App → menu lateral → **Log stream** (tempo real)
   ou **Logs** (consultas mais elaboradas via Log Analytics).
4. Para forçar uma nova revisão depois de re-buildar uma imagem: Container
   App → **Revisions and replicas** → **Create new revision** → confirme
   que está puxando a tag `latest` mais recente (ou aponte para uma tag
   específica que você tenha gerado no Passo 5).

## PASSO 11 — Domínio customizado (hrtechsistemas.com.br)

1. No Container App `hrtech-web` → **Custom domains** → **+ Add custom domain**.
2. Ele vai pedir para você criar, no seu provedor de DNS:
   - Um registro **TXT** (`asuid.hrtechsistemas.com.br`) para provar que o
     domínio é seu.
   - Um registro **CNAME** apontando `hrtechsistemas.com.br` (ou `www`) para
     a Application Url do Passo 10.
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
