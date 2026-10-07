import type { Metadata } from 'next';
import { AutomationManager } from '@/components/ai/automation-manager';
import { PageHeader } from '@/components/ui/misc';
import { requirePageContext } from '@/lib/auth/context';
import { ACTIONS } from '@/server/automations/actions';
import { CONDITION_FIELDS, CONDITION_OPS } from '@/server/automations/conditions';
import { listAutomationRuns, listAutomations } from '@/server/automations/service';
import { listTags } from '@/server/contacts';
import { TRIGGERS } from '@/server/events';
import { listPipelines } from '@/server/pipeline';
import { getMembers } from '@/server/team';

export const metadata: Metadata = { title: 'Automações' };

export default async function AutomationsPage() {
  const ctx = await requirePageContext('automations.manage');
  const [automations, runs, pipelines, members, tags] = await Promise.all([listAutomations(ctx), listAutomationRuns(ctx), listPipelines(ctx), getMembers(ctx), listTags(ctx)]);
  const stages = pipelines.flatMap((p) => p.stages).filter((s) => s.key).map((s) => ({ key: s.key!, name: s.name }));
  return (
    <div>
      <PageHeader title="Automações" description="Gatilhos e ações que trabalham pela sua equipe: criação de tarefas, follow-ups, etiquetas, distribuição e mais." />
      <AutomationManager
        automations={automations.map((a) => ({
          id: a.id, name: a.name, description: a.description, trigger: a.trigger, enabled: a.enabled, runCount: a.runCount, lastRunAt: a.lastRunAt?.toISOString() ?? null,
          conditions: a.conditions as never, actions: a.actions as never,
        }))}
        runs={runs.map((r) => ({ id: r.id, automation: r.automation.name, status: r.status, error: r.error, createdAt: r.createdAt.toISOString(), result: (r.result ?? []) as never }))}
        catalog={{
          triggers: TRIGGERS,
          actions: ACTIONS,
          fields: CONDITION_FIELDS,
          ops: CONDITION_OPS,
          stages: [...new Map(stages.map((s) => [s.key, s])).values()],
          members: members.map((m) => ({ id: m.id, name: m.name })),
          tags: tags.map((t) => t.name),
        }}
      />
    </div>
  );
}
