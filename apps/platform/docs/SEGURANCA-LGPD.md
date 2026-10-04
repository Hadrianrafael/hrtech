# Segurança e LGPD

## Controles implementados

| Tema | Implementação |
| --- | --- |
| Isolamento entre empresas | Escopo automático `tenantDb` + **Row-Level Security** com `FORCE` no PostgreSQL; tenant sempre derivado da sessão/canal; testes de integração cobrindo leitura, escrita, SQL bruto e RAG |
| Autorização no servidor | Toda server action e rota valida sessão, empresa ativa, status da empresa e permissão; serviços repetem a checagem (`assertCan`); escopo por responsável para atendentes |
| Sessões | Token aleatório (256 bits), cookie `httpOnly`/`SameSite=Lax`/`Secure`, armazenado como HMAC, expiração deslizante, revogação |
| Senhas | bcrypt (12), política mínima, bloqueio após 5 falhas, rate limit por IP/e-mail, mensagens genéricas (sem enumeração de usuários) |
| CSRF | Server Actions do Next.js validam `Origin`; cookies `SameSite=Lax`; APIs públicas não usam cookies |
| Validação | Zod em todas as entradas; limites de tamanho; honeypot no formulário público |
| Webhooks | Assinatura HMAC-SHA256 da Meta com comparação em tempo constante; Stripe com tolerância de 5 min; idempotência por chave única; limite de payload |
| Segredos | Somente variáveis de ambiente; credenciais de integrações cifradas com AES-256-GCM (`ENCRYPTION_KEY`); nunca devolvidas à interface |
| Rate limiting | Login, recuperação de senha, convites, widget, formulário e webhooks |
| Logs | JSON estruturado com redação automática de campos sensíveis (senhas, tokens, cookies, assinaturas) |
| Auditoria | `AuditLog` para login, falhas de login, convites, papéis, movimentações, ações administrativas, modo suporte, automações, erros de integração, exportação/anonimização |
| Cabeçalhos | `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` (exceto rotas públicas do widget) |
| XSS | React escapa conteúdo; o widget usa `textContent` e Shadow DOM; CSV exportado neutraliza fórmulas |
| Banco | Alerta no painel se o usuário do banco for SUPERUSER/BYPASSRLS |

## Recursos de apoio à LGPD

- **Registro de origem** do dado (`source`, `sourceDetail`) e de **consentimento** (`consentAt`, `consentSource`,
  `marketingOptIn`); o widget e o formulário pedem consentimento explícito.
- **Portabilidade/acesso**: exportação de todos os dados de um titular em JSON (ficha do contato → menu).
- **Eliminação**: anonimização (remove dados pessoais, conversas, notas e histórico, preservando apenas valores
  agregados) ou exclusão definitiva.
- **Retenção**: configuração por empresa (mín. 30 dias) — mensagens mais antigas são apagadas pela rotina periódica.
- **Minimização**: a IA é instruída a não solicitar dados sensíveis (documentos, cartões, senhas).
- **Segregação**: base de conhecimento, conversas e contatos de uma empresa nunca são usados para outra.
- Exportações, anonimizações e exclusões são auditadas e exigem permissões específicas.

> Estes recursos técnicos **apoiam** a adequação, mas não garantem, por si só, conformidade jurídica com a LGPD.
> Cada empresa cliente (controladora) deve definir bases legais, avisos de privacidade, contratos de operação
> com a HR Tech (operadora), prazos de retenção e procedimentos de atendimento a titulares com apoio jurídico.
> Ao usar provedores de IA, verifique os termos de tratamento e transferência internacional de dados.

## Recomendações para produção

1. Usuário de banco dedicado sem SUPERUSER/BYPASSRLS; TLS na conexão (`?sslmode=require`).
2. `AUTH_SECRET`, `ENCRYPTION_KEY`, `CRON_SECRET` fortes e guardados em cofre (Azure Key Vault / Vercel env).
3. HTTPS obrigatório; domínio próprio; backups automáticos do PostgreSQL com teste de restauração.
4. Rate limit distribuído (Redis) quando houver mais de uma instância.
5. Monitoramento de erros (Application Insights / Sentry) consumindo os logs JSON.
6. Revisar periodicamente o painel `/admin/logs` (erros e webhooks com falha).
