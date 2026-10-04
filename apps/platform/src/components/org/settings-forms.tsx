'use client';

import { Trash2 } from 'lucide-react';
import { changePasswordAction, updateProfileAction } from '@/app/actions/auth';
import { createTagAction, deleteTagAction } from '@/app/actions/crm';
import { saveOrganizationAction } from '@/app/actions/org';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/field';
import { Badge, Card, CardHeader } from '@/components/ui/misc';
import { useAction } from '@/components/ui/use-action';

const SEGMENTS = { hotel: 'Hotel', pousada: 'Pousada', hospedagem: 'Hospedagem', turismo: 'Turismo', servicos: 'Serviços', comercio: 'Comércio', outro: 'Outro' };

export function OrgSettingsForm({ org }: { org: { name: string; segment: string | null; timezone: string; retentionDays: number | null } }) {
  const save = useAction(saveOrganizationAction);
  return (
    <Card>
      <CardHeader title="Empresa" />
      <form action={async (fd) => void (await save.run(fd))} className="grid gap-3 p-4 sm:grid-cols-2">
        <Field label="Nome da empresa" error={save.fieldErrors.name}><Input name="name" defaultValue={org.name} required /></Field>
        <Field label="Segmento">
          <Select name="segment" defaultValue={org.segment ?? ''}>
            <option value="">—</option>
            {Object.entries(SEGMENTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </Field>
        <Field label="Fuso horário">
          <Select name="timezone" defaultValue={org.timezone}>
            {['America/Sao_Paulo', 'America/Manaus', 'America/Bahia', 'America/Fortaleza', 'America/Recife', 'America/Belem', 'America/Cuiaba', 'America/Rio_Branco', 'America/Noronha'].map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
        </Field>
        <Field label="Retenção de mensagens (dias)" error={save.fieldErrors.retentionDays} hint="LGPD: mensagens mais antigas são apagadas automaticamente. Vazio = sem exclusão automática (mín. 30).">
          <Input name="retentionDays" type="number" min={30} defaultValue={org.retentionDays ?? ''} />
        </Field>
        <div className="sm:col-span-2"><Button type="submit" loading={save.pending}>Salvar</Button></div>
      </form>
    </Card>
  );
}

export function TagsManager({ tags, canDelete }: { tags: { id: string; name: string; color: string }[]; canDelete: boolean }) {
  const create = useAction(createTagAction);
  const del = useAction((id: string) => deleteTagAction(id));
  return (
    <Card>
      <CardHeader title="Etiquetas" description="Usadas em contatos, conversas e automações" />
      <div className="space-y-3 p-4">
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <span key={t.id} className="inline-flex items-center gap-1">
              <Badge color={t.color}>{t.name}</Badge>
              {canDelete && <button type="button" onClick={() => confirm(`Excluir etiqueta "${t.name}"?`) && del.run(t.id)} className="text-fg-muted hover:text-danger" aria-label={`Excluir ${t.name}`}><Trash2 className="h-3 w-3" /></button>}
            </span>
          ))}
        </div>
        <form action={async (fd) => void (await create.run(fd))} className="flex gap-2">
          <Input name="name" placeholder="Nova etiqueta" required maxLength={40} aria-label="Nome da etiqueta" />
          <Input name="color" type="color" defaultValue="#6366f1" className="h-9 w-14 p-1" aria-label="Cor" />
          <Button type="submit" variant="secondary" loading={create.pending}>Adicionar</Button>
        </form>
      </div>
    </Card>
  );
}

export function AccountForms({ name, email }: { name: string; email: string }) {
  const profile = useAction(updateProfileAction);
  const pwd = useAction(changePasswordAction);
  return (
    <Card>
      <CardHeader title="Minha conta" description={email} />
      <div className="grid gap-6 p-4 md:grid-cols-2">
        <form action={async (fd) => void (await profile.run(fd))} className="space-y-3">
          <Field label="Seu nome"><Input name="name" defaultValue={name} required /></Field>
          <Button type="submit" variant="secondary" loading={profile.pending}>Atualizar nome</Button>
        </form>
        <form action={async (fd) => { const r = await pwd.run(fd); if (r.ok) (document.getElementById('pwd-form') as HTMLFormElement | null)?.reset(); }} id="pwd-form" className="space-y-3">
          <Field label="Senha atual" error={pwd.fieldErrors.current}><Input name="current" type="password" autoComplete="current-password" required /></Field>
          <Field label="Nova senha" error={pwd.fieldErrors.password}><Input name="password" type="password" autoComplete="new-password" required /></Field>
          <Field label="Confirmar nova senha" error={pwd.fieldErrors.confirm}><Input name="confirm" type="password" autoComplete="new-password" required /></Field>
          <Button type="submit" variant="secondary" loading={pwd.pending}>Alterar senha</Button>
        </form>
      </div>
    </Card>
  );
}
