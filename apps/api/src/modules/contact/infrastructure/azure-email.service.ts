import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailClient } from '@azure/communication-email';
import type { ContactSubmission } from '../domain/contact-submission';
import type { EmailPort } from './email.port';

@Injectable()
export class AzureEmailService implements EmailPort {
  private readonly logger = new Logger(AzureEmailService.name);
  private readonly client: EmailClient | null;
  private readonly senderAddress: string | undefined;
  private readonly recipientAddress: string | undefined;

  constructor(private readonly config: ConfigService) {
    const connectionString = this.config.get<string>('AZURE_COMMUNICATION_CONNECTION_STRING');
    this.senderAddress = this.config.get<string>('CONTACT_SENDER_EMAIL');
    this.recipientAddress = this.config.get<string>('CONTACT_RECIPIENT_EMAIL');
    this.client = connectionString ? new EmailClient(connectionString) : null;

    if (!this.client) {
      this.logger.warn(
        'AZURE_COMMUNICATION_CONNECTION_STRING não configurada — envio de e-mail de contato está desabilitado.',
      );
    }
  }

  async sendContactNotification(submission: ContactSubmission): Promise<void> {
    if (!this.client || !this.senderAddress || !this.recipientAddress) {
      throw new Error(
        'Serviço de e-mail não configurado (AZURE_COMMUNICATION_CONNECTION_STRING / CONTACT_SENDER_EMAIL / CONTACT_RECIPIENT_EMAIL ausentes).',
      );
    }

    const poller = await this.client.beginSend({
      senderAddress: this.senderAddress,
      content: {
        subject: `Novo contato pelo site — ${submission.name}`,
        plainText: [
          `Nome: ${submission.name}`,
          submission.company ? `Empresa: ${submission.company}` : undefined,
          `E-mail: ${submission.email}`,
          submission.phone ? `Telefone: ${submission.phone}` : undefined,
          '',
          submission.message,
        ]
          .filter(Boolean)
          .join('\n'),
      },
      recipients: {
        to: [{ address: this.recipientAddress }],
      },
      replyTo: [{ address: submission.email, displayName: submission.name }],
    });

    await poller.pollUntilDone();
  }
}
