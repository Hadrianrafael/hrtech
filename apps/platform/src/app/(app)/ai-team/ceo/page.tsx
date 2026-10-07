import type { Metadata } from 'next';
import Link from 'next/link';
import { CeoCenter, type CeoBriefingRow, type CeoObjectiveRow } from '@/components/ai-team/ceo-center';
import type { ActivityItem } from '@/components/ai-team/task-activity';
import { jsonRecord, jsonString } from '@/components/ai-team/task-helpers';
import { buttonClass } from '@/components/ui/button';
import { Alert, PageHeader } from '@/components/ui/misc';
import { requirePageContext } from '@/lib/auth/context';
import { listBriefings } from '@/server/ai-company/briefing';
import { COMMAND_EXAMPLES } from '@/server/ai-company/constants';
import { listObjectives } from '@/server/ai-company/objectives';
import { PLAYBOOK_LABELS, type PlaybookKey } from '@/server/ai-company/playbooks';
import { getTeamOverview } from '@/server/ai-company/queries';

export const metadata: Metadata = { title: 'Central do CEO' };

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

function scheduleText(cfg: { enabled: boolean; hour: number; weekdays: number[] }) {
  if (!cfg.enabled) return null;
  const days = [...new Set(cfg.weekdays)].sort((a, b) => a - b);
  const when =
    days.length === 7 ? 'todos os dias' : days.join(',') === '1,2,3,4,5' ? 'de segunda a sexta' : days.length ? days.map((d) => WEEKDAYS[d] ?? d).join(', ') : 'nenhum dia selecionado';
  return `Automático ${when}, às ${String(cfg.hour).padStart(2, '0')}h (fuso da empresa).`;
}

function deliveryNote(delivery: unknown): string | null {
  const status = jsonString(jsonRecord(delivery).status, 40);
  switch (status) {
    case null:
      return null;
    case 'pending_credential':
      return 'envio pelo n8n PENDENTE DE CREDENCIAL';
    case 'sent':
    case 'completed':
      return 'enviado pelo n8n';
    case 'retry':
      return 'envio pelo n8n será tentado novamente';
    default:
      return 'envio pelo n8n na fila';
  }
}

function playbookLabel(plan: unknown, playbook: string | null): string | null {
  const p = jsonRecord(plan);
  const label = jsonString(p.label, 80);
  if (label) return label;
  const key = jsonString(p.playbook, 40) ?? playbook;
  return key ? (PLAYBOOK_LABELS[key as PlaybookKey] ?? null) : null;
}

export default async function CeoCenterPage() {
  const ctx = await requirePageContext('ai_team.view');
  const overview = await getTeamOverview(ctx);

  if (!overview || !overview.company.enabled) {
    return (
      <div>
        <PageHeader title="Central do CEO" description="Envie objetivos ao CEO Agent e acompanhe planos, briefings e aprovações." />
        <Alert tone="yellow" title="A Equipe IA ainda não está ativada para esta empresa">
          <p className="mb-2">Ative a Equipe IA para criar o CEO Agent e os agentes especializados e começar a enviar objetivos.</p>
          <Link href="/ai-team" className={buttonClass('primary', 'sm')}>
            Ativar a Equipe IA
          </Link>
        </Alert>
      </div>
    );
  }

  const [objectives, briefings] = await Promise.all([listObjectives(ctx, { take: 30 }), listBriefings(ctx, 7)]);
  const agentNames = new Map(overview.agents.map((a) => [a.id, a.name]));
  const ceo = overview.agents.find((a) => a.isCeo) ?? null;

  const objectiveRows: CeoObjectiveRow[] = objectives.map((o) => ({
    id: o.id,
    title: o.title,
    status: o.status,
    source: o.source,
    playbookLabel: playbookLabel(o.plan, o.playbook),
    totalTasks: o.tasks.length,
    completedTasks: o.tasks.filter((t) => t.status === 'COMPLETED').length,
    failedTasks: o.tasks.filter((t) => t.status === 'FAILED').length,
    costMicroUsd: o.costMicroUsd,
    createdAt: o.createdAt.toISOString(),
  }));

  const briefingRows: CeoBriefingRow[] = briefings.map((b) => ({
    id: b.id,
    day: b.day,
    content: b.content.slice(0, 20_000),
    deliveryNote: deliveryNote(b.delivery),
    createdAt: b.createdAt.toISOString(),
  }));

  // getTeamOverview já traz as 25 atividades mais recentes (mesma consulta de listActivities).
  const activities: ActivityItem[] = overview.activities.slice(0, 20).map((a) => ({
    id: a.id,
    message: a.message,
    level: a.level,
    createdAt: a.createdAt.toISOString(),
    agentName: a.agentId ? (agentNames.get(a.agentId) ?? null) : null,
    href: a.taskId ? `/ai-team/tasks/${a.taskId}` : a.objectiveId ? `/ai-team/objectives/${a.objectiveId}` : null,
  }));

  return (
    <CeoCenter
      canCommand={ctx.permissions.has('ai_team.command')}
      examples={COMMAND_EXAMPLES}
      paused={overview.company.paused}
      pausedReason={overview.company.pausedReason}
      aiConfigured={overview.providers.some((p) => p.configured)}
      ceo={ceo ? { name: ceo.name, status: ceo.status } : null}
      pendingApprovals={overview.pendingApprovals}
      cost={overview.cost}
      briefingSchedule={scheduleText(overview.briefing)}
      objectives={objectiveRows}
      briefings={briefingRows}
      activities={activities}
    />
  );
}
