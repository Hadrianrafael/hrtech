# Deploy — HR Tech em Azure Container Apps

Runbook para publicar `hrtechsistemas.com.br` na sua assinatura Azure. Todos
os comandos abaixo rodam na sua máquina (ou no Cloud Shell do portal Azure),
com a Azure CLI autenticada — nada disso pode ser executado por mim, já que
não tenho acesso à sua assinatura.

Pré-requisito: [Azure CLI instalada](https://learn.microsoft.com/cli/azure/install-azure-cli) e `az login` feito.

## 1. Criar o resource group

```bash
az group create --name rg-hrtech --location brazilsouth
```

## 2. Provisionar a infraestrutura (Bicep)

O arquivo `infra/main.bicep` cria: Log Analytics, Container Apps Environment,
Azure Container Registry, identidade gerenciada (para pull de imagens sem
usuário/senha), e os dois Container Apps (`api` interno, `web` público).
**Não cria banco de dados** — o schema Prisma está vazio hoje, então não há
nada para persistir ainda.

```bash
az deployment group create \
  --resource-group rg-hrtech \
  --template-file infra/main.bicep \
  --parameters productionDomain=hrtechsistemas.com.br
```

Isso vai falhar a implantação inicial das duas Container Apps porque ainda
não existe imagem nenhuma no ACR — é esperado. Depois do passo 3 (primeiro
build), rode o `az deployment group create` de novo, ou deixe o workflow de
deploy (passo 5) cuidar da atualização de imagem.

Anote os outputs — você vai precisar deles nos próximos passos:

```bash
az deployment group show --resource-group rg-hrtech --name main \
  --query properties.outputs
```

## 3. Primeiro build das imagens

```bash
ACR_NAME=$(az deployment group show --resource-group rg-hrtech --name main --query properties.outputs.acrLoginServer.value -o tsv | cut -d. -f1)

az acr build --registry $ACR_NAME --image hrtech-api:latest --file apps/api/Dockerfile .
az acr build --registry $ACR_NAME --image hrtech-web:latest --file apps/web/Dockerfile .
```

## 4. Domínio customizado (hrtechsistemas.com.br)

```bash
# pega o FQDN público temporário do Container App
az containerapp show --name hrtech-web --resource-group rg-hrtech \
  --query properties.configuration.ingress.fqdn -o tsv
```

No seu provedor de DNS (onde o domínio `hrtechsistemas.com.br` está
registrado), crie:

- Um registro **TXT** `asuid.hrtechsistemas.com.br` com o valor que o comando
  abaixo pedir (verificação de propriedade do domínio).
- Um registro **CNAME** `hrtechsistemas.com.br` → `<FQDN do passo acima>`
  (ou `www` → o mesmo FQDN, se preferir o `www` como principal e redirecionar
  o apex).

Depois de os registros propagarem (pode levar até algumas horas):

```bash
az containerapp hostname add --hostname hrtechsistemas.com.br \
  --name hrtech-web --resource-group rg-hrtech

az containerapp hostname bind --hostname hrtechsistemas.com.br \
  --name hrtech-web --resource-group rg-hrtech \
  --environment hrtech-env --validation-method CNAME
```

O certificado TLS é gerenciado automaticamente pela Azure depois do bind.

## 5. Formulário de contato (Azure Communication Services — Email)

Sem isso, `POST /contact` responde 503 de propósito (já é o comportamento
hoje) em vez de fingir que enviou. Para habilitar:

```bash
az communication create --name hrtech-acs --resource-group rg-hrtech \
  --location global --data-location brazil

az communication email create --name hrtech-acs-email \
  --resource-group rg-hrtech --location global
```

Depois, no portal Azure (a verificação de domínio de e-mail é um passo
manual multi-etapa, não dá pra automatizar por CLI de forma confiável):
1. No recurso Email Communication Service, adicione o domínio
   `hrtechsistemas.com.br` (ou use o domínio gerenciado da Azure para
   testar rápido antes de configurar o seu).
2. Adicione os registros DNS de verificação/SPF/DKIM que o portal pedir.
3. Vincule o domínio verificado ao recurso de Communication Services
   (`hrtech-acs`) e copie a connection string.

Com a connection string em mãos, atualize o Container App `api`:

```bash
az containerapp update --name hrtech-api --resource-group rg-hrtech \
  --set-env-vars \
    AZURE_COMMUNICATION_CONNECTION_STRING=secretref:acs-connection-string \
    CONTACT_SENDER_EMAIL=contato@hrtechsistemas.com.br
```

## 6. Deploy contínuo (GitHub Actions)

O workflow `.github/workflows/deploy.yml` já está pronto — ele roda a CI
completa e, se passar, builda e publica as duas imagens a cada push em
`main`. Para ativar, crie um Service Principal e registre estes secrets no
repositório GitHub (`Settings → Secrets and variables → Actions`):

```bash
az ad sp create-for-rbac --name hrtech-github-deploy \
  --role contributor \
  --scopes /subscriptions/<SUA_SUBSCRIPTION_ID>/resourceGroups/rg-hrtech \
  --sdk-auth
```

O comando acima imprime um JSON — cole esse JSON inteiro no secret
`AZURE_CREDENTIALS`. Depois adicione também:

| Secret | Valor |
|---|---|
| `AZURE_CREDENTIALS` | JSON do comando acima |
| `AZURE_ACR_NAME` | nome do ACR (sem `.azurecr.io`) |
| `AZURE_RESOURCE_GROUP` | `rg-hrtech` |
| `AZURE_API_APP_NAME` | `hrtech-api` |
| `AZURE_WEB_APP_NAME` | `hrtech-web` |

A partir daí, todo merge em `main` publica automaticamente.

## Checklist rápido

- [ ] `az login` feito
- [ ] Resource group criado
- [ ] Bicep implantado (rodar 2x: antes e depois do primeiro `az acr build`)
- [ ] Primeiras imagens buildadas no ACR
- [ ] DNS apontado e domínio customizado vinculado
- [ ] Azure Communication Services + domínio de e-mail verificado
- [ ] Secrets do GitHub Actions configurados
