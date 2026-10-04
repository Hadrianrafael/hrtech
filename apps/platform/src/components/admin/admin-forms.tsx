'use client';

import { Copy, LogIn, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  changeOrganizationPlanAction, createOrganizationAction, enterOrganizationAction, inviteToOrganizationAction, savePlanAction, setOrganizationStatusAction,
  setSubscriptionStatusAction, setUserDisabledAction,
} from '@/app/actions/admin';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/field';
import { Alert } from '@/components/ui/misc';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { useAction } from '@/components/ui/use-action';

const SEGMENTS = { hotel: 'Hotel', pousada: 'Pousada', hospedagem: 'Hospedagem', turismo: 'Turismo', servicos: 'Serviços', comercio: 'Comércio', outro: 'Outro' };

function LinkResult({ link, delivered }: { link: string | null; delivered: boolean }) {
  const toast = useToast();
  return (
    <div className="space-y-2">
      <Alert tone="green" title={delivered ? 'Convite enviado por e-mail' : 'Convite gerado'}>{delivered ? 'A pessoa convidada receberá o link por e-mail.' : 'SMTP não configurado: envie este link à pessoa convidada (válido por 7 dias).'}</Alert>
      {link && <div className="flex gap-2">
        <Input readOnly value={link} aria-label="Link" />
        <Button variant="outline" onClick={() => navigator.clipboard.writeText(link).then(() => toast.success('Copiado.'))} aria-label="Copiar"><Copy className="h-4 w-4" /></Button>
      </div>}
    </div>
  );
}

export function CreateOrganizationButton({ plans }: { plans: { key: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<{ id: string; link: string | null; delivered: boolean } | null>(null);
  const create = useAction(createOrganizationAction, { onSuccess: setResult, success: 'Empresa criada.' });
  return (
    <>
      <Button onClick={() => { setResult(null); setOpen(true); }}><Plus className="h-4 w-4" /> Nova empresa</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Cadastrar empresa" description="Cria o ambiente isolado com funil, chatbot, base de conhecimento e automações padrão.">
        {result ? (
          <div className="space-y-3">
            <LinkResult link={result.link} delivered={result.delivered} />
            <a href={`/admin/organizations/${result.id}`} className="text-sm text-brand hover:underline">Abrir empresa →</a>
          </div>
        ) : (
          <form action={async (fd) => void (await create.run(fd))} className="space-y-3">
            <Field label="Nome da empresa *" error={create.fieldErrors.name}><Input name="name" required /></Field>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Segmento">
                <Select name="segment">{Object.entries(SEGMENTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>
              </Field>
              <Field label="Plano *">
                <Select name="planKey">{plans.map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}</Select>
              </Field>
              <Field label="Dias de teste"><Input name="trialDays" type="number" min={0} max={90} defaultValue={14} /></Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nome do administrador"><Input name="adminName" /></Field>
              <Field label="E-mail do administrador *" error={create.fieldErrors.adminEmail}><Input name="adminEmail" type="email" required /></Field>
            </div>
            <Button type="submit" loading={create.pending} className="w-full justify-center">Criar empresa e convidar administrador</Button>
          </form>
        )}
      </Modal>
    </>
  );
}

export function OrgAdminControls({
  orgId, status, planId, subStatus, plans,
}: {
  orgId: string;
  status: string;
  planId: string | null;
  subStatus: string | null;
  plans: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invite, setInvite] = useState<{ link: string | null; delivered: boolean } | null>(null);
  const setStatus = useAction((s: 'ACTIVE' | 'SUSPENDED', reason?: string) => setOrganizationStatusAction(orgId, s, reason));
  const plan = useAction((id: string) => changeOrganizationPlanAction(orgId, id));
  const sub = useAction((s: string) => setSubscriptionStatusAction(orgId, s as never));
  const enter = useAction(() => enterOrganizationAction(orgId), { refresh: false, onSuccess: () => router.push('/dashboard') });
  const inv = useAction((fd: FormData) => inviteToOrganizationAction(orgId, fd), { onSuccess: setInvite });
  return (
    <div className="flex flex-wrap items-end gap-3">
      <Field label="Plano">
        <Select value={planId ?? ''} onChange={(e) => plan.run(e.target.value)} className="w-44">
          {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
      </Field>
      <Field label="Assinatura">
        <Select value={subStatus ?? ''} onChange={(e) => sub.run(e.target.value)} className="w-44">
          {['TRIALING', 'ACTIVE', 'PAST_DUE', 'PAUSED', 'CANCELED'].map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      </Field>
      {status === 'ACTIVE' ? (
        <Button variant="danger" loading={setStatus.pending} onClick={() => { const r = prompt('Motivo do bloqueio (registrado em auditoria):'); if (r !== null) void setStatus.run('SUSPENDED', r); }}>Bloquear empresa</Button>
      ) : (
        <Button variant="outline" loading={setStatus.pending} onClick={() => setStatus.run('ACTIVE')}>Desbloquear</Button>
      )}
      <Button variant="outline" onClick={() => { setInvite(null); setInviteOpen(true); }}>Convidar usuário</Button>
      <Button variant="secondary" loading={enter.pending} onClick={() => confirm('Entrar nesta empresa em modo suporte? A ação será auditada.') && enter.run()}><LogIn className="h-4 w-4" /> Acessar como suporte</Button>
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Convidar usuário para a empresa" size="sm">
        {invite ? <LinkResult {...invite} /> : (
          <form action={async (fd) => void (await inv.run(fd))} className="space-y-3">
            <Field label="E-mail *"><Input name="email" type="email" required /></Field>
            <Field label="Nome"><Input name="name" /></Field>
            <Field label="Papel">
              <Select name="roleKey" defaultValue="agent">
                <option value="org_admin">Administrador</option>
                <option value="manager">Gestor</option>
                <option value="agent">Atendente/Vendedor</option>
              </Select>
            </Field>
            <Button type="submit" loading={inv.pending} className="w-full justify-center">Gerar convite</Button>
          </form>
        )}
      </Modal>
    </div>
  );
}

export interface PlanRow {
  id: string;
  key: string;
  name: string;
  description: string | null;
  priceCents: number;
  limits: Record<string, number>;
  features: string[];
  active: boolean;
  isPublic: boolean;
  position: number;
  subscriptions: number;
}

export function PlanEditor({ plan, limitLabels, onDone }: { plan?: PlanRow; limitLabels: Record<string, string>; onDone?: () => void }) {
  const save = useAction((fd: FormData) => savePlanAction(plan?.id ?? null, fd), { onSuccess: onDone });
  return (
    <form action={async (fd) => void (await save.run(fd))} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Chave *"><Input name="key" defaultValue={plan?.key} required pattern="[a-z0-9_\-]{2,40}" /></Field>
        <Field label="Nome *"><Input name="name" defaultValue={plan?.name} required /></Field>
        <Field label="Preço mensal (R$)"><Input name="price" defaultValue={plan ? (plan.priceCents / 100).toFixed(2) : ''} inputMode="decimal" /></Field>
      </div>
      <Field label="Descrição"><Input name="description" defaultValue={plan?.description ?? ''} /></Field>
      <fieldset className="rounded-lg border p-3">
        <legend className="px-1 text-xs text-fg-muted">Limites (vazio = ilimitado)</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {Object.entries(limitLabels).map(([k, v]) => (
            <Field key={k} label={v}><Input name={`limit_${k}`} type="number" min={0} defaultValue={plan?.limits[k] ?? ''} /></Field>
          ))}
        </div>
      </fieldset>
      <Field label="Recursos exibidos (um por linha)"><Textarea name="features" defaultValue={plan?.features.join('\n')} rows={4} /></Field>
      <div className="flex flex-wrap items-center gap-4">
        <Checkbox name="active" label="Ativo" defaultChecked={plan?.active ?? true} />
        <Checkbox name="isPublic" label="Visível para clientes" defaultChecked={plan?.isPublic ?? true} />
        <Field label="Ordem"><Input name="position" type="number" defaultValue={plan?.position ?? 0} className="w-24" /></Field>
      </div>
      <Button type="submit" loading={save.pending}>Salvar plano</Button>
    </form>
  );
}

export function PlanList({ plans, limitLabels }: { plans: PlanRow[]; limitLabels: Record<string, string> }) {
  const [editing, setEditing] = useState<PlanRow | 'new' | null>(null);
  return (
    <>
      <div className="mb-3 flex justify-end"><Button onClick={() => setEditing('new')}><Plus className="h-4 w-4" /> Novo plano</Button></div>
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((p) => (
          <div key={p.id} className="card space-y-2 p-4">
            <div className="flex items-center justify-between"><p className="font-semibold">{p.name}</p><span className="text-xs text-fg-muted">{p.key}</span></div>
            <p className="text-xl font-semibold">{(p.priceCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
            <p className="text-xs text-fg-muted">{p.subscriptions} assinatura(s) · {p.active ? 'ativo' : 'inativo'} · {p.isPublic ? 'público' : 'oculto'}</p>
            <ul className="text-xs text-fg-muted">{Object.entries(limitLabels).map(([k, v]) => <li key={k}>{v}: {p.limits[k] ?? '∞'}</li>)}</ul>
            <Button size="sm" variant="outline" onClick={() => setEditing(p)}>Editar</Button>
          </div>
        ))}
      </div>
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'Novo plano' : 'Editar plano'} size="lg">
        {editing && <PlanEditor key={editing === 'new' ? 'new' : editing.id} plan={editing === 'new' ? undefined : editing} limitLabels={limitLabels} onDone={() => setEditing(null)} />}
      </Modal>
    </>
  );
}

export function UserToggle({ userId, disabled }: { userId: string; disabled: boolean }) {
  const r = useAction(() => setUserDisabledAction(userId, !disabled));
  return <Button size="sm" variant="ghost" loading={r.pending} onClick={() => r.run()}>{disabled ? 'Reativar' : 'Desativar'}</Button>;
}
