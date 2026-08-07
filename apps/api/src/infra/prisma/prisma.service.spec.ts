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

  it('onModuleInit does not throw when $connect() fails', async () => {
    const service = new PrismaService();
    const warnSpy = vi.spyOn(service['logger'], 'warn');
    vi.spyOn(service, '$connect').mockRejectedValue(
      new Error('Can\'t reach database server at `localhost:5432`'),
    );

    await expect(service.onModuleInit()).resolves.not.toThrow();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to connect to database at startup'),
    );
  });
});
