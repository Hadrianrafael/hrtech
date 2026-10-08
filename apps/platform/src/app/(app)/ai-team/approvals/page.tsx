import type { Metadata } from 'next';
import { ApprovalsList, type ApprovalHistoryRow, type PendingApprovalRow } from '@/components/ai-team/approvals-list';
import { jsonPreview } from '@/components/ai-team/task-helpers';
import { PageHeader } from '@/components/ui/misc';
import { requirePageContext } from '@/lib/auth/context';
import { listApprovals } from '@/server/ai-company/approvals';
import { SENSITIVE_CATEGORIES, type SensitiveCategory } from '@/server/ai-company/constants';
import { getTool } from '@/server/ai-company/tools';

export const metadata: Metadata = { title: 'Aprovações da Equipe IA' };

/** Tamanho do conteúdo exibido de imediato; acima disso, o restante fica disponível sob demanda. */
const PREVIEW_CHARS = 4000;
/** Teto absoluto do conteúdo completo enviado ao navegador (mantém a página leve). */
const FULL_CHARS = 40_000;
const HISTORY_LIMIT = 50;

function stringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2) ?? 'null';
  } catch {
    return String(value);
  }
}

function categoryList(categories: string[]) {
  return categories.map((c) => ({ key: c, label: SENSITIVE_CATEGORIES[c as SensitiveCategory] ?? c }));
}

function toolLabel(key: string) {
  return getTool(key)?.label ?? null;
}

export default async function AiApprovalsPage() {
  const ctx = await requirePageContext('ai_team.view');
  // Pendentes em consulta própria: nenhuma aprovação aberta fica de fora por causa do limite do histórico.
  const [pendingRows, recentRows] = await Promise.all([listApprovals(ctx, { status: 'PENDING', take: 100 }), listApprovals(ctx, { take: 100 })]);
  const now = Date.now();

  const pending: PendingApprovalRow[] = pendingRows.map((a) => {
    const text = stringify(a.payload);
    const truncated = text.length > PREVIEW_CHARS;
    return {
      id: a.id,
      agentId: a.agentId,
      agentName: a.agentName,
      tool: a.tool,
      toolLabel: toolLabel(a.tool),
      risk: a.risk,
      categories: categoryList(a.categories),
      summary: a.summary,
      reason: a.reason,
      payloadPreview: truncated ? text.slice(0, PREVIEW_CHARS) : text,
      payloadFull: truncated ? text.slice(0, FULL_CHARS) : null,
      payloadLength: text.length,
      payloadOverLimit: text.length > FULL_CHARS,
      taskId: a.taskId,
      task: a.task ? { id: a.task.id, title: a.task.title, objectiveId: a.task.objectiveId } : null,
      createdAt: a.createdAt.toISOString(),
      expiresAt: a.expiresAt.toISOString(),
      expired: a.expiresAt.getTime() <= now,
    };
  });

  const history: ApprovalHistoryRow[] = recentRows
    .filter((a) => a.status !== 'PENDING')
    .slice(0, HISTORY_LIMIT)
    .map((a) => ({
      id: a.id,
      agentId: a.agentId,
      agentName: a.agentName,
      tool: a.tool,
      toolLabel: toolLabel(a.tool),
      risk: a.risk,
      categories: categoryList(a.categories),
      summary: a.summary.slice(0, 1000),
      status: a.status,
      decisionNote: a.decisionNote,
      decidedAt: a.decidedAt?.toISOString() ?? null,
      createdAt: a.createdAt.toISOString(),
      taskId: a.taskId,
      task: a.task ? { id: a.task.id, title: a.task.title, objectiveId: a.task.objectiveId } : null,
      payloadPreview: jsonPreview(a.payload, 1500),
    }));

  return (
    <div>
      <PageHeader
        title="Aprovações"
        description="Ações sensíveis que os agentes só executam com o seu aval: preço, desconto, contrato, pagamento, gastos, exclusões, mensagens a clientes e outras ações irreversíveis."
      />
      <ApprovalsList pending={pending} history={history} canApprove={ctx.permissions.has('ai_team.approve')} />
    </div>
  );
}
