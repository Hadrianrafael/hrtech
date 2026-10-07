import { RISK_LABELS, ROLE_TOOLS, isAgentKey } from '../constants';
import { agentsDelegate, calendarSchedule, devRequestChange, draftsWrite, followupsSchedule, leadsAssignOwner, leadsCreate, leadsImportProspects, leadsUpdateStatus, memorySave, messagesSend, notesAdd, opportunitiesMoveStage, proposalsDraft, tasksCreate } from './actions';
import { analyticsConversion, approvalsPending, calendarUpcoming, companyOverview, conversationsWaiting, financeOverview, leadsNeedingFollowup, leadsSearch, memorySearch, pipelineSummary, tasksList, teamStatus } from './data';
import { n8nDevIssue, n8nFinanceCharge, n8nMarketingPublish, n8nProspectSearch, n8nSalesSequence } from './external';
import type { ToolDef } from './types';

const ALL: ToolDef[] = [
  companyOverview, pipelineSummary, leadsNeedingFollowup, leadsSearch, conversationsWaiting, tasksList, calendarUpcoming,
  analyticsConversion, memorySearch, approvalsPending, teamStatus, financeOverview,
  memorySave, tasksCreate, notesAdd, draftsWrite, agentsDelegate, followupsSchedule, devRequestChange,
  leadsUpdateStatus, opportunitiesMoveStage, leadsAssignOwner, leadsCreate, leadsImportProspects, calendarSchedule,
  messagesSend, proposalsDraft,
  n8nProspectSearch, n8nSalesSequence, n8nMarketingPublish, n8nDevIssue, n8nFinanceCharge,
] as unknown as ToolDef[];

export const TOOLS: Record<string, ToolDef> = Object.fromEntries(ALL.map((t) => [t.key, t]));

/**
 * Ações que NENHUM agente executa (não existem como ferramenta): pedidos assim são bloqueados e registrados.
 * Merge na main, deploy em produção e manipulação de credenciais são sempre feitos por pessoas.
 */
export const FORBIDDEN_PATTERNS = [/merge/i, /deploy/i, /credential|credencia|secret|senha|password|token/i, /delete|exclu|apagar|remove/i, /git\./i, /shell|exec|bash|sql/i];

export function getTool(key: string): ToolDef | undefined {
  return Object.prototype.hasOwnProperty.call(TOOLS, key) ? TOOLS[key] : undefined;
}

/** Ferramentas que um agente pode usar agora: allowlist do agente ∩ teto do cargo ∩ ferramentas existentes. */
export function allowedToolsFor(agent: { key: string; tools: string[] }): ToolDef[] {
  const ceiling = isAgentKey(agent.key) ? new Set(ROLE_TOOLS[agent.key]) : new Set<string>();
  return agent.tools.filter((k) => ceiling.has(k)).map((k) => getTool(k)).filter((t): t is ToolDef => !!t);
}

export function isToolAllowed(agent: { key: string; tools: string[] }, key: string) {
  return allowedToolsFor(agent).some((t) => t.key === key);
}

/** Catálogo para a tela de configuração (ferramentas possíveis do cargo, com risco). */
export function roleToolCatalog(agentKey: string) {
  const keys = isAgentKey(agentKey) ? ROLE_TOOLS[agentKey] : [];
  return keys
    .map((k) => getTool(k))
    .filter((t): t is ToolDef => !!t)
    .map((t) => ({ key: t.key, label: t.label, description: t.description, risk: t.risk, riskLabel: RISK_LABELS[t.risk], categories: t.categories ?? [] }));
}

export type { ToolDef, ToolResult, ToolRunContext } from './types';
