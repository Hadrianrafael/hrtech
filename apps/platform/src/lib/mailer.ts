import nodemailer from 'nodemailer';
import { env } from './env';
import { logger } from './logger';

export interface MailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * E-mails transacionais da plataforma (convites, redefinição de senha).
 * Sem SMTP configurado, o envio é registrado no log (modo desenvolvimento) e o chamador
 * recebe `delivered: false` para poder exibir o link na interface.
 */
export async function sendTransactionalMail(input: MailInput): Promise<{ delivered: boolean }> {
  const smtp = env.smtp();
  if (!smtp) {
    logger.warn('mail.smtp_not_configured', { to: input.to.replace(/(.{2}).*@/, '$1***@'), subject: input.subject });
    if (!env.isProd && !env.isTest) console.log(`\n[mail:dev] Para: ${input.to}\nAssunto: ${input.subject}\n${input.text}\n`);
    return { delivered: false };
  }
  try {
    const transport = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: smtp.user ? { user: smtp.user, pass: smtp.pass } : undefined,
    });
    await transport.sendMail({ from: smtp.from, to: input.to, subject: input.subject, text: input.text, html: input.html });
    return { delivered: true };
  } catch (err) {
    logger.error('mail.send_failed', { err });
    return { delivered: false };
  }
}
