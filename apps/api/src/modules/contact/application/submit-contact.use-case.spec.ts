import { describe, it, expect, vi } from 'vitest';
import { ServiceUnavailableException } from '@nestjs/common';
import { SubmitContactUseCase } from './submit-contact.use-case';
import type { EmailPort } from '../infrastructure/email.port';

describe('SubmitContactUseCase', () => {
  it('normalizes the submission and sends it through the email port', async () => {
    const email: EmailPort = { sendContactNotification: vi.fn().mockResolvedValue(undefined) };
    const useCase = new SubmitContactUseCase(email);

    await useCase.execute({ name: '  Ana  ', email: '  ANA@Example.com  ', message: '  Olá  ' });

    expect(email.sendContactNotification).toHaveBeenCalledWith({
      name: 'Ana',
      company: undefined,
      email: 'ana@example.com',
      phone: undefined,
      message: 'Olá',
    });
  });

  it('maps an email delivery failure to ServiceUnavailableException', async () => {
    const email: EmailPort = {
      sendContactNotification: vi.fn().mockRejectedValue(new Error('connection refused')),
    };
    const useCase = new SubmitContactUseCase(email);

    await expect(useCase.execute({ name: 'Ana', email: 'ana@example.com', message: 'Olá' })).rejects.toThrow(
      ServiceUnavailableException,
    );
  });
});
