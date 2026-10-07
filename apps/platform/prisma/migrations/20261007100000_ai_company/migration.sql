-- AI Company (Equipe IA): CEO Agent, agentes especializados, tarefas, aprovações, memória, briefing e fila do n8n.

-- CreateEnum
CREATE TYPE "AiAgentStatus" AS ENUM ('ACTIVE', 'PAUSED', 'DISABLED');

-- CreateEnum
CREATE TYPE "AiAutonomy" AS ENUM ('MANUAL', 'SUPERVISED', 'AUTONOMOUS');

-- CreateEnum
CREATE TYPE "AiTaskStatus" AS ENUM ('QUEUED', 'RUNNING', 'WAITING_APPROVAL', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AiObjectiveStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_APPROVAL', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AiApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "AiCompany" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "paused" BOOLEAN NOT NULL DEFAULT false,
    "pausedReason" TEXT,
    "dailyBudgetCents" INTEGER NOT NULL DEFAULT 500,
    "monthlyBudgetCents" INTEGER NOT NULL DEFAULT 5000,
    "limits" JSONB NOT NULL DEFAULT '{}',
    "briefing" JSONB NOT NULL DEFAULT '{}',
    "n8nEnabled" BOOLEAN NOT NULL DEFAULT false,
    "n8nWorkflows" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiAgent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "department" TEXT NOT NULL,
    "isCeo" BOOLEAN NOT NULL DEFAULT false,
    "provider" TEXT NOT NULL DEFAULT 'auto',
    "model" TEXT,
    "autonomy" "AiAutonomy" NOT NULL DEFAULT 'SUPERVISED',
    "status" "AiAgentStatus" NOT NULL DEFAULT 'ACTIVE',
    "tools" TEXT[],
    "limits" JSONB NOT NULL DEFAULT '{}',
    "currentPromptId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiPromptVersion" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiPromptVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiObjective" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "command" TEXT NOT NULL,
    "status" "AiObjectiveStatus" NOT NULL DEFAULT 'OPEN',
    "playbook" TEXT,
    "plan" JSONB NOT NULL DEFAULT '{}',
    "result" TEXT,
    "resultData" JSONB NOT NULL DEFAULT '{}',
    "source" TEXT NOT NULL DEFAULT 'USER',
    "createdById" TEXT,
    "costMicroUsd" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AiObjective_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiTask" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "objectiveId" TEXT,
    "parentTaskId" TEXT,
    "agentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'work',
    "status" "AiTaskStatus" NOT NULL DEFAULT 'QUEUED',
    "priority" INTEGER NOT NULL DEFAULT 5,
    "depth" INTEGER NOT NULL DEFAULT 0,
    "input" JSONB NOT NULL DEFAULT '{}',
    "result" TEXT,
    "resultData" JSONB NOT NULL DEFAULT '{}',
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "nextRunAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedUntil" TIMESTAMP(3),
    "waitingFor" TEXT,
    "blockedReason" TEXT,
    "steps" INTEGER NOT NULL DEFAULT 0,
    "tokensIn" INTEGER NOT NULL DEFAULT 0,
    "tokensOut" INTEGER NOT NULL DEFAULT 0,
    "costMicroUsd" INTEGER NOT NULL DEFAULT 0,
    "createdByUserId" TEXT,
    "createdByAgentId" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiTaskRun" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "attempt" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "mode" TEXT NOT NULL,
    "provider" TEXT,
    "model" TEXT,
    "steps" INTEGER NOT NULL DEFAULT 0,
    "tokensIn" INTEGER NOT NULL DEFAULT 0,
    "tokensOut" INTEGER NOT NULL DEFAULT 0,
    "costMicroUsd" INTEGER NOT NULL DEFAULT 0,
    "latencyMs" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "transcript" JSONB NOT NULL DEFAULT '[]',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "AiTaskRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiToolCall" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "runId" TEXT,
    "agentId" TEXT NOT NULL,
    "tool" TEXT NOT NULL,
    "risk" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "output" JSONB,
    "status" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "error" TEXT,
    "suspicious" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executedAt" TIMESTAMP(3),

    CONSTRAINT "AiToolCall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiApproval" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "toolCallId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "tool" TEXT NOT NULL,
    "risk" TEXT NOT NULL,
    "categories" TEXT[],
    "summary" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "status" "AiApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decisionNote" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiMemory" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "agentId" TEXT,
    "scope" TEXT NOT NULL DEFAULT 'COMPANY',
    "kind" TEXT NOT NULL DEFAULT 'FACT',
    "title" TEXT,
    "content" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'USER',
    "importance" INTEGER NOT NULL DEFAULT 1,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "sourceTaskId" TEXT,
    "createdById" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiMemory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiActivity" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "agentId" TEXT,
    "objectiveId" TEXT,
    "taskId" TEXT,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'info',
    "data" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiBriefing" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "delivery" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiBriefing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "N8nDispatch" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "workflow" TEXT NOT NULL,
    "taskId" TEXT,
    "toolCallId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 8,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastError" TEXT,
    "responseStatus" INTEGER,
    "result" JSONB,
    "externalId" TEXT,
    "sentAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "N8nDispatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiCompany_organizationId_key" ON "AiCompany"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "AiAgent_organizationId_key_key" ON "AiAgent"("organizationId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "AiPromptVersion_agentId_version_key" ON "AiPromptVersion"("agentId", "version");

-- CreateIndex
CREATE INDEX "AiObjective_organizationId_createdAt_idx" ON "AiObjective"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "AiTask_status_nextRunAt_idx" ON "AiTask"("status", "nextRunAt");

-- CreateIndex
CREATE INDEX "AiTask_organizationId_status_idx" ON "AiTask"("organizationId", "status");

-- CreateIndex
CREATE INDEX "AiTask_objectiveId_idx" ON "AiTask"("objectiveId");

-- CreateIndex
CREATE INDEX "AiTask_parentTaskId_idx" ON "AiTask"("parentTaskId");

-- CreateIndex
CREATE INDEX "AiTaskRun_organizationId_startedAt_idx" ON "AiTaskRun"("organizationId", "startedAt");

-- CreateIndex
CREATE INDEX "AiTaskRun_taskId_idx" ON "AiTaskRun"("taskId");

-- CreateIndex
CREATE INDEX "AiTaskRun_agentId_startedAt_idx" ON "AiTaskRun"("agentId", "startedAt");

-- CreateIndex
CREATE INDEX "AiToolCall_taskId_idx" ON "AiToolCall"("taskId");

-- CreateIndex
CREATE INDEX "AiToolCall_organizationId_createdAt_idx" ON "AiToolCall"("organizationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AiToolCall_organizationId_idempotencyKey_key" ON "AiToolCall"("organizationId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "AiApproval_toolCallId_key" ON "AiApproval"("toolCallId");

-- CreateIndex
CREATE INDEX "AiApproval_organizationId_status_createdAt_idx" ON "AiApproval"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "AiMemory_organizationId_agentId_idx" ON "AiMemory"("organizationId", "agentId");

-- CreateIndex
CREATE INDEX "AiActivity_organizationId_createdAt_idx" ON "AiActivity"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "AiActivity_objectiveId_idx" ON "AiActivity"("objectiveId");

-- CreateIndex
CREATE INDEX "AiActivity_taskId_idx" ON "AiActivity"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "AiBriefing_organizationId_day_key" ON "AiBriefing"("organizationId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "N8nDispatch_idempotencyKey_key" ON "N8nDispatch"("idempotencyKey");

-- CreateIndex
CREATE INDEX "N8nDispatch_status_nextAttemptAt_idx" ON "N8nDispatch"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "N8nDispatch_organizationId_createdAt_idx" ON "N8nDispatch"("organizationId", "createdAt");

-- AddForeignKey
ALTER TABLE "AiCompany" ADD CONSTRAINT "AiCompany_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiAgent" ADD CONSTRAINT "AiAgent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiPromptVersion" ADD CONSTRAINT "AiPromptVersion_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AiAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiObjective" ADD CONSTRAINT "AiObjective_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiTask" ADD CONSTRAINT "AiTask_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AiAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiTask" ADD CONSTRAINT "AiTask_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "AiObjective"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiMemory" ADD CONSTRAINT "AiMemory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "N8nDispatch" ADD CONSTRAINT "N8nDispatch_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Row-Level Security: as tabelas novas seguem a mesma política de isolamento por organização.
DO $$
DECLARE
  t text;
  tenant_tables text[] := ARRAY[
    'AiCompany','AiAgent','AiPromptVersion','AiObjective','AiTask','AiTaskRun','AiToolCall',
    'AiApproval','AiMemory','AiActivity','AiBriefing','N8nDispatch'
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

-- Permissões do papel restrito (os privilégios padrão já cobrem tabelas novas; aqui fica explícito e idempotente).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'hrtech_rls') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "AiCompany", "AiAgent", "AiPromptVersion", "AiObjective", "AiTask",
      "AiTaskRun", "AiToolCall", "AiApproval", "AiMemory", "AiActivity", "AiBriefing", "N8nDispatch" TO hrtech_rls;
  END IF;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'Não foi possível conceder permissões ao papel hrtech_rls (%).', SQLERRM;
END $$;
