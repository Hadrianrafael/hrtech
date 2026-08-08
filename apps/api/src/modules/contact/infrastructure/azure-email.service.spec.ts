import { describe, it, expect } from 'vitest';
import type { ConfigService } from '@nestjs/config';
import { AzureEmailService } from './azure-email.service';

function makeConfig(values: Record<string, string | undefined>): ConfigService {
  return {
    get: (key: string) => values[key],
  } as unknown as ConfigService;
}

describe('AzureEmailService', () => {
  it('throws when the connection string is not configured', async () => {
    const service = new AzureEmailService(makeConfig({}));

    await expect(
      service.sendContactNotification({
        name: 'Ana',
        email: 'ana@example.com',
        message: 'Olá',
      }),
    ).rejects.toThrow(/não configurado/);
  });

  it('throws when sender or recipient address is missing even with a connection string', async () => {
    const service = new AzureEmailService(
      makeConfig({
        AZURE_COMMUNICATION_CONNECTION_STRING: 'endpoint=https://example.communication.azure.com/;accesskey=fake',
      }),
    );

    await expect(
      service.sendContactNotification({
        name: 'Ana',
        email: 'ana@example.com',
        message: 'Olá',
      }),
    ).rejects.toThrow(/não configurado/);
  });
});
