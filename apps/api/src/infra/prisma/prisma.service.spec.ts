import { describe, it, expect, vi } from 'vitest';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  it('isHealthy returns true when the database responds', async () => {
    const service = new PrismaService();
    vi.spyOn(service, '$queryRaw').mockResolvedValue([{ '?column?': 1 }]);

    await expect(service.isHealthy()).resolves.toBe(true);
  });

  it('isHealthy returns false when the query throws', async () => {
    const service = new PrismaService();
    vi.spyOn(service, '$queryRaw').mockRejectedValue(new Error('connection refused'));

    await expect(service.isHealthy()).resolves.toBe(false);
  });
});
