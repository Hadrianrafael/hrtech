'use client';

import { Copy, Mail, Pencil, Plus, ShieldCheck, Trash2, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { changeMemberRoleAction, deleteRoleAction, inviteMemberAction, revokeInvitationAction, saveRoleAction, setMemberStatusAction } from '@/app/actions/org';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input, Select } from '@/components/ui/field';
import { Alert, Avatar, Badge, Card, CardHeader } from '@/components/ui/misc';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { useAction } from '@/components/ui/use-action';
import { Time } from '@/components/shared/time';

export interface TeamData {
  members: { membershipId: string; userId: string; name: string; email: string; roleId: string; status: string; lastLoginAt: string | null }[];
  invitations: { id: string; email: string; roleName: string; expiresAt: string }[];
  roles: { id: string; name: string; description: string | null; isSystem: boolean; permissions: string[] }[];
  permissions: Record<string, string>;
  currentUserId: string;
  canManage: boolean;
  canManageRoles: boolean;
}

export function TeamManager({ data }: { data: TeamData }) {
  const toast = useToast();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ link: string | null; delivered: boolean } | null>(null);
  const [roleEdit, setRoleEdit] = useState<TeamData['roles'][number] | 'new' | null>(null);
  const invite = useAction(inviteMemberAction, { onSuccess: (r) => setInviteResult(r), success: (r) => (r.delivered ? 'Convite enviado por e-mail.' : 'Convite criado.') });
  const changeRole = useAction((id: string, roleId: string) => changeMemberRoleAction(id, roleId));
  const setStatus = useAction((id: string, s: 'ACTIVE' | 'DISABLED') => setMemberStatusAction(id, s));
  const revoke = useAction((id: string) => revokeInvitationAction(id));
  const saveRole = useAction((fd: FormData) => saveRoleAction(roleEdit && roleEdit !== 'new' ? roleEdit.id : null, fd), { onSuccess: () => setRoleEdit(null) });
  const delRole = useAction((id: string) => deleteRoleAction(id));
  const currentRole = roleEdit && roleEdit !== 'new' ? roleEdit : null;

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <CardHeader
          title={`Membros (${data.members.length})`}
          action={data.canManage && <Button size="sm" onClick={() => { setInviteResult(null); setInviteOpen(true); }}><UserPlus className="h-3.5 w-3.5" /> Convidar</Button>}
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/50 text-left text-xs text-fg-muted">
              <tr><th className="px-4 py-2 font-medium">Usuário</th><th className="px-4 py-2 font-medium">Papel</th><th className="px-4 py-2 font-medium">Último acesso</th><th className="px-4 py-2 font-medium">Status</th><th /></tr>
            </thead>
            <tbody className="divide-y">
              {data.members.map((m) => (
                <tr key={m.membershipId}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={m.name} size={30} />
                      <div><p className="font-medium">{m.name}{m.userId === data.currentUserId && <span className="text-xs text-fg-muted"> (você)</span>}</p><p className="text-xs text-fg-muted">{m.email}</p></div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    {data.canManage ? (
                      <Select value={m.roleId} onChange={(e) => changeRole.run(m.membershipId, e.target.value)} className="h-8 w-48 text-xs" aria-label="Papel">
                        {data.roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </Select>
                    ) : (
                      data.roles.find((r) => r.id === m.roleId)?.name
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-fg-muted">{m.lastLoginAt ? <Time date={m.lastLoginAt} /> : 'Nunca'}</td>
                  <td className="px-4 py-2.5"><Badge tone={m.status === 'ACTIVE' ? 'green' : 'gray'}>{m.status === 'ACTIVE' ? 'Ativo' : 'Desativado'}</Badge></td>
                  <td className="px-4 py-2.5 text-right">
                    {data.canManage && m.userId !== data.currentUserId && (
                      <Button size="sm" variant="ghost" onClick={() => setStatus.run(m.membershipId, m.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE')}>
                        {m.status === 'ACTIVE' ? 'Desativar' : 'Reativar'}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {data.invitations.length > 0 && (
        <Card>
          <CardHeader title="Convites pendentes" />
          <ul className="divide-y">
            {data.invitations.map((i) => (
              <li key={i.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <Mail className="h-4 w-4 text-fg-muted" />
                <span className="flex-1">{i.email} <span className="text-xs text-fg-muted">· {i.roleName} · expira em <Time date={i.expiresAt} mode="date" /></span></span>
                {data.canManage && <Button size="sm" variant="ghost" onClick={() => revoke.run(i.id)}>Revogar</Button>}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <CardHeader
          title="Papéis e permissões"
          description="Papéis de sistema são fixos; crie papéis personalizados para necessidades específicas."
          action={data.canManageRoles && <Button size="sm" variant="outline" onClick={() => setRoleEdit('new')}><Plus className="h-3.5 w-3.5" /> Papel</Button>}
        />
        <ul className="divide-y">
          {data.roles.map((r) => (
            <li key={r.id} className="flex items-start gap-3 px-4 py-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-fg-muted" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{r.name} {r.isSystem && <Badge>Sistema</Badge>}</p>
                <p className="text-xs text-fg-muted">{r.description ?? ''} {r.permissions.length} de {Object.keys(data.permissions).length} permissões.</p>
              </div>
              {!r.isSystem && data.canManageRoles && (
                <>
                  <Button size="icon" variant="ghost" onClick={() => setRoleEdit(r)} aria-label="Editar papel"><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => confirm('Excluir papel?') && delRole.run(r.id)} aria-label="Excluir papel"><Trash2 className="h-4 w-4" /></Button>
                </>
              )}
            </li>
          ))}
        </ul>
      </Card>

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Convidar para a equipe" size="sm">
        {inviteResult ? (
          <div className="space-y-3">
            <Alert tone="green" title={inviteResult.delivered ? 'Convite enviado por e-mail' : 'Convite criado'}>
              {inviteResult.delivered ? 'A pessoa receberá o link por e-mail.' : 'SMTP não configurado: compartilhe o link abaixo com a pessoa convidada (válido por 7 dias).'}
            </Alert>
            {inviteResult.link && (
              <div className="flex gap-2">
                <Input readOnly value={inviteResult.link} aria-label="Link do convite" />
                <Button variant="outline" onClick={() => navigator.clipboard.writeText(inviteResult.link!).then(() => toast.success('Link copiado.'))} aria-label="Copiar"><Copy className="h-4 w-4" /></Button>
              </div>
            )}
            <Button variant="ghost" onClick={() => setInviteResult(null)}>Convidar outra pessoa</Button>
          </div>
        ) : (
          <form action={async (fd) => void (await invite.run(fd))} className="space-y-3">
            <Field label="E-mail *" error={invite.fieldErrors.email}><Input name="email" type="email" required autoFocus /></Field>
            <Field label="Nome"><Input name="name" /></Field>
            <Field label="Papel *">
              <Select name="roleId" defaultValue={data.roles.find((r) => r.name.startsWith('Atendente'))?.id}>
                {data.roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </Select>
            </Field>
            <Button type="submit" loading={invite.pending} className="w-full justify-center">Gerar convite</Button>
          </form>
        )}
      </Modal>

      <Modal open={!!roleEdit} onClose={() => setRoleEdit(null)} title={currentRole ? `Editar papel: ${currentRole.name}` : 'Novo papel'} size="lg">
        <form key={currentRole?.id ?? 'new'} action={async (fd) => void (await saveRole.run(fd))} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nome *"><Input name="name" defaultValue={currentRole?.name} required /></Field>
            <Field label="Descrição"><Input name="description" defaultValue={currentRole?.description ?? ''} /></Field>
          </div>
          <div className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2">
            {Object.entries(data.permissions).map(([k, label]) => (
              <Checkbox key={k} name="permissions" value={k} label={<span className="text-xs">{label}</span>} defaultChecked={currentRole?.permissions.includes(k)} />
            ))}
          </div>
          <Button type="submit" loading={saveRole.pending} className="w-full justify-center">Salvar papel</Button>
        </form>
      </Modal>
    </div>
  );
}
