'use server';

import { after } from 'next/server';
import { withOrg } from '@/lib/action-ctx';
import { assertCan } from '@/lib/auth/ctx';
import { logger } from '@/lib/logger';
import { activateAiCompany, activatePromptVersion, createPromptVersion, setCompanyPaused, updateAgent, updateCompanySettings, type agentConfigSchema, type companySettingsSchema, type promptSchema } from '@/server/ai-company/agents';
import { decideApproval } from '@/server/ai-company/approvals';
import { requestBriefingNow } from '@/server/ai-company/briefing';
import { createMemory, deleteMemory, updateMemory, type memoryInputSchema } from '@/server/ai-company/memory';
import { retryDispatch } from '@/server/ai-company/n8n';
import { cancelObjective, createObjective } from '@/server/ai-company/objectives';
import { cancelAiTask, retryAiTask } from '@/server/ai-company/queries';
import { runAiWorker } from '@/server/ai-company/worker';
import type { z } from 'zod';

/** Depois de responder, processa a fila desta empresa (sem esperar o próximo ciclo do cron). */
function kickWorker(orgId: string) {
  after(async () => {
    try {
      await runAiWorker({ orgId, maxTasks: 8, budgetMs: 25_000, housekeeping: false });
    } catch (err) {
      logger.error('ai_team.kick_failed', { orgId, err });
    }
  });
}

export async function sendCommandAction(command: string) {
  return withOrg('ai_team.command', async (ctx) => {
    const objective = await createObjective(ctx, { command });
    kickWorker(ctx.orgId);
    return { objectiveId: objective.id };
  }, 'Objetivo enviado ao CEO Agent.');
}

export async function cancelObjectiveAction(id: string) {
  return withOrg('ai_team.command', (ctx) => cancelObjective(ctx, id), 'Objetivo cancelado.');
}

export async function decideApprovalAction(id: string, decision: 'approve' | 'reject', note?: string) {
  return withOrg('ai_team.approve', async (ctx) => {
    const r = await decideApproval(ctx, id, { decision, note });
    kickWorker(ctx.orgId);
    return r;
  }, decision === 'approve' ? 'Ação aprovada: o agente vai executá-la.' : 'Ação rejeitada.');
}

export async function retryAiTaskAction(id: string) {
  return withOrg('ai_team.command', async (ctx) => {
    await retryAiTask(ctx, id);
    kickWorker(ctx.orgId);
  }, 'Tarefa recolocada na fila.');
}

export async function cancelAiTaskAction(id: string) {
  return withOrg('ai_team.command', (ctx) => cancelAiTask(ctx, id), 'Tarefa cancelada.');
}

export async function updateAgentAction(id: string, input: z.input<typeof agentConfigSchema>) {
  return withOrg('ai_team.manage', async (ctx) => {
    await updateAgent(ctx, id, input);
  }, 'Agente atualizado.');
}

export async function createPromptVersionAction(agentId: string, input: z.input<typeof promptSchema>) {
  return withOrg('ai_team.manage', async (ctx) => ({ version: (await createPromptVersion(ctx, agentId, input)).version }), 'Nova versão do prompt salva.');
}

export async function activatePromptVersionAction(agentId: string, versionId: string) {
  return withOrg('ai_team.manage', (ctx) => activatePromptVersion(ctx, agentId, versionId), 'Versão ativada.');
}

export async function setPausedAction(paused: boolean, reason?: string) {
  return withOrg('ai_team.manage', async (ctx) => {
    await setCompanyPaused(ctx, paused, reason);
    if (!paused) kickWorker(ctx.orgId);
  }, paused ? 'Equipe IA pausada.' : 'Equipe IA retomada.');
}

export async function updateCompanySettingsAction(input: z.input<typeof companySettingsSchema>) {
  return withOrg('ai_team.manage', async (ctx) => {
    await updateCompanySettings(ctx, input);
  }, 'Configurações salvas.');
}

export async function activateAiCompanyAction() {
  return withOrg('ai_team.manage', async (ctx) => {
    await activateAiCompany(ctx);
  }, 'Equipe IA ativada.');
}

export async function createMemoryAction(input: z.input<typeof memoryInputSchema>) {
  return withOrg('ai_team.manage', async (ctx) => {
    await createMemory(ctx, input);
  }, 'Memória registrada.');
}

export async function updateMemoryAction(id: string, input: { pinned?: boolean; content?: string; title?: string | null; importance?: number }) {
  return withOrg('ai_team.manage', async (ctx) => {
    await updateMemory(ctx, id, input);
  }, 'Memória atualizada.');
}

export async function deleteMemoryAction(id: string) {
  return withOrg('ai_team.manage', (ctx) => deleteMemory(ctx, id), 'Memória removida.');
}

export async function requestBriefingAction() {
  return withOrg('ai_team.command', async (ctx) => {
    const task = await requestBriefingNow(ctx);
    kickWorker(ctx.orgId);
    return { queued: !!task };
  }, 'Briefing solicitado ao CEO Agent.');
}

export async function retryDispatchAction(id: string) {
  return withOrg('ai_team.manage', async (ctx) => {
    const ok = await retryDispatch(ctx.orgId, id);
    kickWorker(ctx.orgId);
    return { ok };
  }, 'Envio recolocado na fila do n8n.');
}

/** Processa a fila agora (útil quando não há cron frequente configurado). */
export async function runWorkerNowAction() {
  return withOrg('ai_team.manage', async (ctx) => {
    assertCan(ctx, 'ai_team.manage');
    return runAiWorker({ orgId: ctx.orgId, maxTasks: 10, budgetMs: 40_000 });
  });
}
