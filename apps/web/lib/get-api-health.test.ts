import { afterEach, describe, expect, it, vi } from 'vitest';
import { getApiHealth } from './get-api-health';

describe('getApiHealth', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the parsed status when the API responds with a valid payload', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: () =>
          Promise.resolve({ status: 'ok', service: 'api', timestamp: '2026-01-01T00:00:00.000Z' }),
      }),
    );

    const result = await getApiHealth();

    expect(result.status).toBe('ok');
  });

  it('returns an error status when the request throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));

    const result = await getApiHealth();

    expect(result.status).toBe('error');
  });

  it('returns an error status when the payload is not a valid HealthStatus', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ unexpected: true }),
      }),
    );

    const result = await getApiHealth();

    expect(result.status).toBe('error');
  });
});
