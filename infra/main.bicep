// HR Tech — portfólio institucional
// Provisiona o essencial para rodar os dois serviços já dockerizados
// (apps/web e apps/api) em Azure Container Apps. Não provisiona banco de
// dados: o schema Prisma está vazio hoje (nenhum modelo definido) — a API
// já funciona sem DATABASE_URL, então adicionar um Postgres seria custo e
// complexidade sem uso real. Adicione isso quando houver um modelo de fato.
//
// Uso:
//   az group create --name rg-hrtech --location brazilsouth
//   az deployment group create \
//     --resource-group rg-hrtech \
//     --template-file infra/main.bicep \
//     --parameters contactSenderEmail=<...> azureCommunicationConnectionString=<...>

@description('Prefixo usado no nome dos recursos.')
param namePrefix string = 'hrtech'

@description('Região do Azure.')
param location string = resourceGroup().location

@description('Domínio de produção do site (sem protocolo).')
param productionDomain string = 'hrtechsistemas.com.br'

@description('E-mail remetente configurado no Azure Communication Services (Email). Deixe vazio para configurar depois.')
@secure()
param contactSenderEmail string = ''

@description('Connection string do Azure Communication Services (Email). Deixe vazio para configurar depois — o endpoint de contato responde 503 até isso ser definido.')
@secure()
param azureCommunicationConnectionString string = ''

@description('E-mail que recebe as submissões do formulário de contato.')
param contactRecipientEmail string = 'contato@hrtechsistemas.com.br'

@description('Tag da imagem a ser implantada (normalmente o SHA do commit, definido pelo workflow de deploy).')
param imageTag string = 'latest'

var acrName = replace('${namePrefix}acr', '-', '')
var logAnalyticsName = '${namePrefix}-logs'
var envName = '${namePrefix}-env'
var apiAppName = '${namePrefix}-api'
var webAppName = '${namePrefix}-web'

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logAnalyticsName
  location: location
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
  }
}

resource acr 'Microsoft.ContainerRegistry/registries@2023-11-01-preview' = {
  name: acrName
  location: location
  sku: { name: 'Basic' }
  properties: {
    adminUserEnabled: false
  }
}

resource containerAppsEnv 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: envName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

// Identidade gerenciada compartilhada — permite que os Container Apps
// puxem imagens do ACR sem precisar de usuário/senha de admin.
resource pullIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: '${namePrefix}-pull-identity'
  location: location
}

resource acrPullRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(acr.id, pullIdentity.id, 'AcrPull')
  scope: acr
  properties: {
    principalId: pullIdentity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d') // AcrPull
  }
}

// API — apenas alcançável de dentro do Container Apps Environment.
// O Next.js (apps/web/app/api/contact/route.ts) chama esta URL do lado do
// servidor; o navegador do visitante nunca acessa a API diretamente.
resource apiApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: apiAppName
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${pullIdentity.id}': {}
    }
  }
  properties: {
    managedEnvironmentId: containerAppsEnv.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: false
        targetPort: 3001
      }
      registries: [
        {
          server: acr.properties.loginServer
          identity: pullIdentity.id
        }
      ]
      secrets: !empty(azureCommunicationConnectionString) ? [
        {
          name: 'acs-connection-string'
          value: azureCommunicationConnectionString
        }
      ] : []
    }
    template: {
      containers: [
        {
          name: 'api'
          image: '${acr.properties.loginServer}/hrtech-api:${imageTag}'
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: concat(
            [
              { name: 'NODE_ENV', value: 'production' }
              { name: 'PORT', value: '3001' }
              { name: 'CORS_ORIGIN', value: 'https://${productionDomain}' }
              { name: 'CONTACT_RECIPIENT_EMAIL', value: contactRecipientEmail }
            ],
            !empty(contactSenderEmail) ? [{ name: 'CONTACT_SENDER_EMAIL', value: contactSenderEmail }] : [],
            !empty(azureCommunicationConnectionString) ? [{ name: 'AZURE_COMMUNICATION_CONNECTION_STRING', secretRef: 'acs-connection-string' }] : []
          )
        }
      ]
      scale: {
        minReplicas: 0
        maxReplicas: 3
      }
    }
  }
}

// Web — a única app com ingress externo. hrtechsistemas.com.br é vinculado
// como custom domain depois, via `az containerapp hostname add` (passo
// manual, ver docs/deploy-azure.md).
resource webApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: webAppName
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${pullIdentity.id}': {}
    }
  }
  properties: {
    managedEnvironmentId: containerAppsEnv.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 3000
      }
      registries: [
        {
          server: acr.properties.loginServer
          identity: pullIdentity.id
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'web'
          image: '${acr.properties.loginServer}/hrtech-web:${imageTag}'
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            { name: 'NODE_ENV', value: 'production' }
            { name: 'API_URL', value: 'http://${apiApp.properties.configuration.ingress.fqdn}' }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 3
      }
    }
  }
}

output acrLoginServer string = acr.properties.loginServer
output webAppFqdn string = webApp.properties.configuration.ingress.fqdn
output apiAppInternalFqdn string = apiApp.properties.configuration.ingress.fqdn
output pullIdentityClientId string = pullIdentity.properties.clientId
