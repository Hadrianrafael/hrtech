import nodemailer from 'nodemailer';

/**
 * E-mail via SMTP (envio) + IMAP (recebimento) com credenciais por organização.
 * Para Gmail/Microsoft 365, use senha de app ou, futuramente, OAuth2 (XOAUTH2) — ver docs/INTEGRACOES.md.
 */
export interface EmailAccountConfig {
  address: string;
  displayName?: string | null;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  imapHost?: string | null;
  imapPort: number;
  username: string;
  password: string;
}

export function normalizeMessageId(id: string | null | undefined): string | null {
  if (!id) return null;
  const v = id.trim();
  return v ? (v.startsWith('<') ? v : `<${v}>`) : null;
}

/** Chave de thread: primeira referência, senão In-Reply-To, senão o próprio Message-ID. */
export function threadKeyFromHeaders(h: { messageId?: string | null; inReplyTo?: string | null; references?: string[] | string | null }): string | null {
  const refs = Array.isArray(h.references) ? h.references : h.references ? h.references.split(/\s+/) : [];
  return normalizeMessageId(refs[0]) ?? normalizeMessageId(h.inReplyTo) ?? normalizeMessageId(h.messageId);
}

export function stripQuotedReply(text: string): string {
  const lines = text.replace(/\r/g, '').split('\n');
  const cut = lines.findIndex((l) => /^(em|on) .+(escreveu|wrote):?$/i.test(l.trim()) || /^-{2,}\s*original message/i.test(l.trim()) || /^>/.test(l));
  return (cut > 0 ? lines.slice(0, cut) : lines).join('\n').trim();
}

export async function sendEmailMessage(
  cfg: EmailAccountConfig,
  mail: { to: string; subject: string; text: string; inReplyTo?: string | null; references?: string[] },
) {
  const transport = nodemailer.createTransport({
    host: cfg.smtpHost,
    port: cfg.smtpPort,
    secure: cfg.smtpSecure,
    auth: { user: cfg.username, pass: cfg.password },
    connectionTimeout: 15_000,
  });
  const info = await transport.sendMail({
    from: cfg.displayName ? `"${cfg.displayName}" <${cfg.address}>` : cfg.address,
    to: mail.to,
    subject: mail.subject,
    text: mail.text,
    inReplyTo: mail.inReplyTo ?? undefined,
    references: mail.references?.length ? mail.references : undefined,
  });
  return normalizeMessageId(info.messageId);
}

export async function verifySmtp(cfg: EmailAccountConfig) {
  const transport = nodemailer.createTransport({
    host: cfg.smtpHost,
    port: cfg.smtpPort,
    secure: cfg.smtpSecure,
    auth: { user: cfg.username, pass: cfg.password },
    connectionTimeout: 15_000,
  });
  await transport.verify();
}

export interface FetchedEmail {
  uid: number;
  messageId: string | null;
  threadKey: string | null;
  fromAddress: string | null;
  fromName: string | null;
  subject: string;
  text: string;
  date: Date;
}

/** Busca mensagens novas (UID > lastUid) da INBOX via IMAP. */
export async function fetchNewEmails(cfg: EmailAccountConfig, lastUid: number, max = 50): Promise<FetchedEmail[]> {
  if (!cfg.imapHost) return [];
  const { ImapFlow } = await import('imapflow');
  const { simpleParser } = await import('mailparser');
  const client = new ImapFlow({
    host: cfg.imapHost,
    port: cfg.imapPort,
    secure: cfg.imapPort === 993,
    auth: { user: cfg.username, pass: cfg.password },
    logger: false,
  });
  const out: FetchedEmail[] = [];
  await client.connect();
  try {
    const lock = await client.getMailboxLock('INBOX');
    try {
      for await (const msg of client.fetch({ uid: `${lastUid + 1}:*` }, { uid: true, source: true }, { uid: true })) {
        if (msg.uid <= lastUid || !msg.source) continue;
        const parsed = await simpleParser(msg.source);
        const from = parsed.from?.value[0];
        out.push({
          uid: msg.uid,
          messageId: normalizeMessageId(parsed.messageId),
          threadKey: threadKeyFromHeaders({ messageId: parsed.messageId, inReplyTo: parsed.inReplyTo, references: parsed.references }),
          fromAddress: from?.address?.toLowerCase() ?? null,
          fromName: from?.name || null,
          subject: parsed.subject ?? '(sem assunto)',
          text: stripQuotedReply(parsed.text ?? '').slice(0, 20_000),
          date: parsed.date ?? new Date(),
        });
        if (out.length >= max) break;
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => undefined);
  }
  return out;
}

export async function verifyImap(cfg: EmailAccountConfig) {
  if (!cfg.imapHost) return;
  const { ImapFlow } = await import('imapflow');
  const client = new ImapFlow({ host: cfg.imapHost, port: cfg.imapPort, secure: cfg.imapPort === 993, auth: { user: cfg.username, pass: cfg.password }, logger: false });
  await client.connect();
  await client.logout();
}
