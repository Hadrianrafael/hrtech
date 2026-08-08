import { describe, it, expect, vi } from 'vitest';
import { GetReadinessUseCase } from './get-readiness.use-case';
import type { PrismaService } from '../../../../infra/prisma/prisma.service';

describe('GetReadinessUseCase', () => {
  it('returns ok when the database is healthy', async () => {
    const prisma = { isHealthy: vi.fn().mockResolvedValue(true) } as unknown as PrismaService;
    const useCase = new GetReadinessUseCase(prisma);

    const result = await useCase.execute();

    expect(result.status).toBe('ok');
    expect(result.service).toBe('api');
  });

  it('returns error when the database is unhealthy', async () => {
    const prisma = { isHealthy: vi.fn().mockResolvedValue(false) } as unknown as PrismaService;
    const useCase = new GetReadinessUseCase(prisma);

    const result = await useCase.execute();

    expect(result.status).toBe('error');
  });
});
