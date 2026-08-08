import type { ContactSubmission } from '../domain/contact-submission';

export const EMAIL_PORT = Symbol('EMAIL_PORT');

export interface EmailPort {
  sendContactNotification(submission: ContactSubmission): Promise<void>;
}
