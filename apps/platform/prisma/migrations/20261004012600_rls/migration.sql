-- Row-Level Security: isolamento multi-tenant no nível do banco.
--
-- A aplicação define, por transação:
--   app.org_id     → organização ativa (tenantDb)
--   app.bypass_rls → 'on' apenas em operações de sistema (auth, webhooks, cron, painel HR Tech)
--
-- FORCE ROW LEVEL SECURITY faz as políticas valerem também para o dono das tabelas.
-- IMPORTANTE: o usuário do banco usado pela aplicação NÃO pode ser SUPERUSER nem BYPASSRLS.

CREATE OR REPLACE FUNCTION app_rls_bypass() RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT coalesce(current_setting('app.bypass_rls', true), '') = 'on'
$$;

CREATE OR REPLACE FUNCTION app_current_org() RETURNS text LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('app.org_id', true), '')
$$;

DO $$
DECLARE
  t text;
  tenant_tables text[] := ARRAY[
    'Membership','Invitation','Subscription','Usage','Contact','ContactIdentity','Tag','ContactTag',
    'Note','Pipeline','PipelineStage','Opportunity','TimelineEvent','Integration','EmailAccount',
    'MessageTemplate','Conversation','ConversationTag','Message','Chatbot','KnowledgeBase',
    'KnowledgeDocument','KnowledgeChunk','AiRun','Appointment','Task','Automation','AutomationRun'
  ];
BEGIN
  FOREACH t IN ARRAY tenant_tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING (app_rls_bypass() OR "organizationId" = app_current_org()) WITH CHECK (app_rls_bypass() OR "organizationId" = app_current_org())',
      t
    );
  END LOOP;
END $$;

-- Organization: cada tenant enxerga apenas a própria linha.
ALTER TABLE "Organization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Organization" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "Organization"
  USING (app_rls_bypass() OR id = app_current_org())
  WITH CHECK (app_rls_bypass() OR id = app_current_org());

-- Role: papéis de sistema (organizationId nulo) são legíveis por todos; escrita só no próprio tenant.
ALTER TABLE "Role" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Role" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "Role"
  USING (app_rls_bypass() OR "organizationId" IS NULL OR "organizationId" = app_current_org())
  WITH CHECK (app_rls_bypass() OR "organizationId" = app_current_org());

-- Tabelas de sistema com organizationId opcional: só acessíveis em modo sistema ou pelo próprio tenant.
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "AuditLog"
  USING (app_rls_bypass() OR "organizationId" = app_current_org())
  WITH CHECK (app_rls_bypass() OR "organizationId" = app_current_org());

ALTER TABLE "WebhookEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WebhookEvent" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "WebhookEvent"
  USING (app_rls_bypass() OR "organizationId" = app_current_org())
  WITH CHECK (app_rls_bypass() OR "organizationId" = app_current_org());
