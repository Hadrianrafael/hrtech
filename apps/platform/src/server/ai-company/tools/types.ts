import type { AiAgent, AiCompany, AiTask } from '@prisma/client';
import type { z } from 'zod';
import type { ServiceCtx } from '@/lib/auth/ctx';
import type { SensitiveCategory } from '../constants';
import type { Risk } from '../policy';

/** Contexto entregue a uma ferramenta: sempre restrito à empresa da tarefa. */
export interface ToolRunContext {
  /** Contexto de serviço da empresa (actorType AI). Todas as consultas passam pelo isolamento multi-tenant. */
  ctx: ServiceCtx;
  orgId: string;
  agent: AiAgent;
  task: AiTask;
  company: AiCompany;
  runId: string | null;
  toolCallId: string;
  idempotencyKey: string;
}

export interface ToolResult {
  /** Dados estruturados devolvidos ao agente (entram no prompt como dados não confiáveis). */
  data: unknown;
  /** Resumo legível (relatórios, histórico e tela de execuções). */
  summary: string;
  /** A ação continua fora da SaaS (n8n): a tarefa aguarda o retorno. */
  waitingExternal?: { dispatchId: string };
}

export interface ToolAssessment {
  risk?: Risk;
  categories?: SensitiveCategory[];
}

export interface ToolDef<S extends z.ZodTypeAny = z.ZodTypeAny> {
  key: string;
  label: string;
  /** Descrição para o modelo (o que faz e quando usar). */
  description: string;
  /** Exemplo de argumentos em JSON, exibido no prompt. */
  argsHint: string;
  risk: Risk;
  categories?: SensitiveCategory[];
  schema: S;
  /** Reavalia risco/categorias a partir dos argumentos (ex.: texto com preço, etapa de ganho). */
  assess?: (tc: Omit<ToolRunContext, 'toolCallId' | 'runId' | 'idempotencyKey'>, args: z.output<S>) => Promise<ToolAssessment> | ToolAssessment;
  /** Texto exibido na tela de aprovação. */
  describe: (args: z.output<S>) => string;
  run: (tc: ToolRunContext, args: z.output<S>) => Promise<ToolResult>;
}

export function defineTool<S extends z.ZodTypeAny>(def: ToolDef<S>): ToolDef<S> {
  return def;
}
