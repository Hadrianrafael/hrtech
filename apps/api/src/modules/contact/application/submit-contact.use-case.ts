import { Inject, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { normalizeContactSubmission, type ContactSubmission } from '../domain/contact-submission';
import { EMAIL_PORT, type EmailPort } from '../infrastructure/email.port';

@Injectable()
export class SubmitContactUseCase {
  private readonly logger = new Logger(SubmitContactUseCase.name);

  constructor(@Inject(EMAIL_PORT) private readonly email: EmailPort) {}

  async execute(input: ContactSubmission): Promise<void> {
    const submission = normalizeContactSubmission(input);

    try {
      await this.email.sendContactNotification(submission);
    } catch (error) {
      this.logger.error(
        `Falha ao enviar notificação de contato: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new ServiceUnavailableException(
        'Não foi possível enviar sua mensagem no momento. Tente novamente em instantes ou fale conosco pelo WhatsApp.',
      );
    }
  }
}
