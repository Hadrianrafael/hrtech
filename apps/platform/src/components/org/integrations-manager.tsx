'use client';

import { Camera, CheckCircle2, Globe, Mail, MessageCircle, PlugZap, Power, RefreshCw, Settings2, Trash2, XCircle } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { syncEmailAction } from '@/app/actions/inbox';
import {
  deleteIntegrationAction, saveEmailAction, saveInstagramAction, saveWhatsAppAction, setIntegrationEnabledAction, testIntegrationAction,
} from '@/app/actions/org';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input, Select } from '@/components/ui/field';
import { Alert, Badge, Card, CardHeader } from '@/components/ui/misc';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { useAction } from '@/components/ui/use-action';
import { Time } from '@/components/shared/time';

export interface IntegrationRow {
  id: string;
  type: string;
  name: string;
  status: string;
  externalId: string | null;
  config: Record<string, unknown>;
  lastError: string | null;
  lastEventAt: string | null;
  hasSecrets: boolean;
  email?: { address: string; lastSyncAt: string | null; syncError: string | null; imapHost: string | null } | null;
}

const STATUS: Record<string, { label: string; tone: 'green' | 'yellow' | 'red' | 'gray' }> = {
  CONNECTED: { label: 'Conectado', tone: 'green' },
  PENDING: { label: 'Aguardando teste', tone: 'yellow' },
  ERROR: { label: 'Erro', tone: 'red' },
  DISABLED: { label: 'Desativado', tone: 'gray' },
  NOT_CONFIGURED: { label: 'Não configurado', tone: 'gray' },
};

export function IntegrationsManager({
  items, platform,
}: {
  items: IntegrationRow[];
  platform: { appUrl: string; metaAppSecret: boolean; whatsappVerifyToken: boolean; instagramVerifyToken: boolean; ai: boolean; smtp: boolean; billing: string };
}) {
  const toast = useToast();
  const [form, setForm] = useState<{ type: string; item?: IntegrationRow } | null>(null);
  const test = useAction((id: string) => testIntegrationAction(id), {
    success: (r) => (r.ok ? `Conexão OK: ${r.detail}` : null),
    onSuccess: (r) => !r.ok && toast.error(`Falha no teste: ${r.detail}`),
  });
  const enable = useAction((id: string, on: boolean) => setIntegrationEnabledAction(id, on));
  const del = useAction((id: string) => deleteIntegrationAction(id));
  const sync = useAction((id: string) => syncEmailAction(id), { success: (r) => `${r.imported} e-mail(s) importado(s).` });

  const byType = (t: string) => items.filter((i) => i.type === t);
  const webhook = (path: string) => `${platform.appUrl}${path}`;

  const section = (type: string, title: string, icon: ReactNode, desc: string, extra?: ReactNode) => (
    <Card>
      <CardHeader
        title={<span className="flex items-center gap-2">{icon} {title}</span>}
        description={desc}
        action={type !== 'WEBCHAT' && <Button size="sm" variant="outline" onClick={() => setForm({ type })}><PlugZap className="h-3.5 w-3.5" /> Conectar</Button>}
      />
      <div className="space-y-3 p-4">
        {extra}
        {byType(type).map((i) => (
          <div key={i.id} className="rounded-lg border p-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="flex-1 text-sm font-medium">{i.name}{i.email ? ` · ${i.email.address}` : i.externalId ? ` · ${i.externalId}` : ''}</p>
              <Badge tone={STATUS[i.status]?.tone}>{STATUS[i.status]?.label ?? i.status}</Badge>
            </div>
            <p className="mt-1 text-xs text-fg-muted">
              {i.lastEventAt ? <>Último evento recebido <Time date={i.lastEventAt} /></> : 'Nenhum evento recebido ainda'}
              {i.email?.lastSyncAt ? <> · última sincronização <Time date={i.email.lastSyncAt} /></> : ''}
            </p>
            {(i.lastError || i.email?.syncError) && <p className="mt-1 text-xs text-danger">{i.lastError ?? i.email?.syncError}</p>}
            {type !== 'WEBCHAT' && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Button size="sm" variant="outline" loading={test.pending} onClick={() => test.run(i.id)}><CheckCircle2 className="h-3.5 w-3.5" /> Testar conexão</Button>
                <Button size="sm" variant="ghost" onClick={() => setForm({ type, item: i })}><Settings2 className="h-3.5 w-3.5" /> Editar</Button>
                {type === 'EMAIL' && i.status === 'CONNECTED' && i.email?.imapHost && (
                  <Button size="sm" variant="ghost" loading={sync.pending} onClick={() => sync.run(i.id)}><RefreshCw className="h-3.5 w-3.5" /> Sincronizar agora</Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => enable.run(i.id, i.status === 'DISABLED')}><Power className="h-3.5 w-3.5" /> {i.status === 'DISABLED' ? 'Reativar' : 'Desativar'}</Button>
                <Button size="sm" variant="ghost" onClick={() => confirm('Remover esta integração?') && del.run(i.id)}><Trash2 className="h-3.5 w-3.5" /> Remover</Button>
              </div>
            )}
          </div>
        ))}
        {!byType(type).length && <p className="text-xs text-fg-muted">Nenhuma conta conectada.</p>}
      </div>
    </Card>
  );

  const Flag = ({ ok, label }: { ok: boolean; label: string }) => (
    <span className="flex items-center gap-1.5 text-xs">{ok ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> : <XCircle className="h-3.5 w-3.5 text-danger" />} {label}</span>
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Configuração da plataforma" description="Variáveis de ambiente globais (definidas pela HR Tech no servidor)" />
        <div className="grid gap-2 p-4 sm:grid-cols-3">
          <Flag ok={platform.metaAppSecret} label="META_APP_SECRET (assinatura dos webhooks)" />
          <Flag ok={platform.whatsappVerifyToken} label="WHATSAPP_VERIFY_TOKEN" />
          <Flag ok={platform.instagramVerifyToken} label="INSTAGRAM_VERIFY_TOKEN" />
          <Flag ok={platform.ai} label="Provedor de IA (OPENAI_API_KEY)" />
          <Flag ok={platform.smtp} label="SMTP transacional (convites/senhas)" />
          <span className="text-xs">Billing: <strong>{platform.billing}</strong></span>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {section('WHATSAPP', 'WhatsApp Business (Cloud API oficial)', <MessageCircle className="h-4 w-4 text-success" />, 'Recebimento e envio via WhatsApp Business Platform da Meta.', (
          <Alert tone="blue" title="Webhook para configurar no painel da Meta">
            <span className="break-all">URL de callback: {webhook('/api/webhooks/whatsapp')}</span> · campo &quot;messages&quot;. O token de verificação é o valor de WHATSAPP_VERIFY_TOKEN.
          </Alert>
        ))}
        {section('INSTAGRAM', 'Instagram (API oficial de mensagens)', <Camera className="h-4 w-4 text-pink-600" />, 'Mensagens diretas de contas profissionais elegíveis.', (
          <Alert tone="blue" title="Webhook para configurar no painel da Meta">
            <span className="break-all">URL de callback: {webhook('/api/webhooks/instagram')}</span> · campo &quot;messages&quot;.
          </Alert>
        ))}
        {section('EMAIL', 'E-mail (SMTP + IMAP)', <Mail className="h-4 w-4 text-info" />, 'Caixa de entrada e envio usando a conta de e-mail da empresa.')}
        {section('WEBCHAT', 'Chat do site', <Globe className="h-4 w-4 text-brand" />, 'Widget incorporável — configure em Chatbot e IA.')}
      </div>

      <Modal open={!!form} onClose={() => setForm(null)} title={form?.item ? `Editar ${form.item.name}` : 'Conectar canal'} size="lg">
        {form?.type === 'WHATSAPP' && <WhatsAppForm item={form.item} onDone={() => setForm(null)} />}
        {form?.type === 'INSTAGRAM' && <InstagramForm item={form.item} onDone={() => setForm(null)} />}
        {form?.type === 'EMAIL' && <EmailForm item={form.item} onDone={() => setForm(null)} />}
      </Modal>
    </div>
  );
}

function SecretHint({ has }: { has: boolean }) {
  return <>{has ? 'Já configurado (armazenado criptografado). Deixe vazio para manter.' : 'Armazenado criptografado (AES-256-GCM). Nunca é exibido novamente.'}</>;
}

function WhatsAppForm({ item, onDone }: { item?: IntegrationRow; onDone: () => void }) {
  const save = useAction((fd: FormData) => saveWhatsAppAction(item?.id ?? null, fd), { onSuccess: onDone });
  const cfg = item?.config as { phoneNumberId?: string; wabaId?: string } | undefined;
  return (
    <form action={async (fd) => void (await save.run(fd))} className="space-y-3">
      <Alert tone="yellow">Requer conta no Meta Business, app com o produto WhatsApp e número aprovado. Use um token de System User com permissão whatsapp_business_messaging.</Alert>
      <Field label="Nome"><Input name="name" defaultValue={item?.name ?? 'WhatsApp'} /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Phone Number ID *" error={save.fieldErrors.phoneNumberId}><Input name="phoneNumberId" defaultValue={cfg?.phoneNumberId ?? ''} required inputMode="numeric" /></Field>
        <Field label="WhatsApp Business Account ID" error={save.fieldErrors.wabaId}><Input name="wabaId" defaultValue={cfg?.wabaId ?? ''} inputMode="numeric" /></Field>
      </div>
      <Field label="Token de acesso" hint={<SecretHint has={!!item?.hasSecrets} />}><Input name="accessToken" type="password" autoComplete="off" /></Field>
      <Button type="submit" loading={save.pending} className="w-full justify-center">Salvar</Button>
    </form>
  );
}

function InstagramForm({ item, onDone }: { item?: IntegrationRow; onDone: () => void }) {
  const save = useAction((fd: FormData) => saveInstagramAction(item?.id ?? null, fd), { onSuccess: onDone });
  const cfg = item?.config as { igUserId?: string; username?: string; apiBase?: string } | undefined;
  return (
    <form action={async (fd) => void (await save.run(fd))} className="space-y-3">
      <Alert tone="yellow">Disponível para contas profissionais do Instagram elegíveis, com app Meta aprovado para instagram_business_manage_messages.</Alert>
      <Field label="Nome"><Input name="name" defaultValue={item?.name ?? 'Instagram'} /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="ID da conta profissional (IG User ID) *" error={save.fieldErrors.igUserId}><Input name="igUserId" defaultValue={cfg?.igUserId ?? ''} required inputMode="numeric" /></Field>
        <Field label="Usuário (@)"><Input name="username" defaultValue={cfg?.username ?? ''} /></Field>
      </div>
      <Field label="Tipo de login da API">
        <Select name="apiBase" defaultValue={cfg?.apiBase ?? 'https://graph.instagram.com'}>
          <option value="https://graph.instagram.com">Instagram API com login do Instagram</option>
          <option value="https://graph.facebook.com">Instagram API com login do Facebook (Página)</option>
        </Select>
      </Field>
      <Field label="Token de acesso" hint={<SecretHint has={!!item?.hasSecrets} />}><Input name="accessToken" type="password" autoComplete="off" /></Field>
      <Button type="submit" loading={save.pending} className="w-full justify-center">Salvar</Button>
    </form>
  );
}

function EmailForm({ item, onDone }: { item?: IntegrationRow; onDone: () => void }) {
  const save = useAction((fd: FormData) => saveEmailAction(item?.id ?? null, fd), { onSuccess: onDone });
  return (
    <form action={async (fd) => void (await save.run(fd))} className="space-y-3">
      <Alert tone="blue">Para Gmail e Microsoft 365, gere uma &quot;senha de app&quot; (com verificação em duas etapas). OAuth2 está previsto para uma próxima versão.</Alert>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nome"><Input name="name" defaultValue={item?.name ?? 'E-mail'} /></Field>
        <Field label="Endereço *" error={save.fieldErrors.address}><Input name="address" type="email" defaultValue={item?.email?.address ?? ''} required /></Field>
        <Field label="Nome de exibição"><Input name="displayName" /></Field>
        <Field label="Usuário *" error={save.fieldErrors.username}><Input name="username" defaultValue={item?.email?.address ?? ''} required /></Field>
        <Field label="Servidor SMTP *" error={save.fieldErrors.smtpHost}><Input name="smtpHost" placeholder="smtp.seuprovedor.com" required /></Field>
        <Field label="Porta SMTP"><Input name="smtpPort" type="number" defaultValue={587} /></Field>
        <Field label="Servidor IMAP (recebimento)"><Input name="imapHost" placeholder="imap.seuprovedor.com" defaultValue={item?.email?.imapHost ?? ''} /></Field>
        <Field label="Porta IMAP"><Input name="imapPort" type="number" defaultValue={993} /></Field>
      </div>
      <Checkbox name="smtpSecure" label="SMTP com SSL/TLS direto (porta 465)" />
      <Field label="Senha / senha de app" hint={<SecretHint has={!!item} />}><Input name="password" type="password" autoComplete="off" /></Field>
      <Button type="submit" loading={save.pending} className="w-full justify-center">Salvar</Button>
    </form>
  );
}
