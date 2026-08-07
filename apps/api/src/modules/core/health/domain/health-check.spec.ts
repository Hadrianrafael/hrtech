import { describe, it, expect } from 'vitest';
import { buildHealthStatus } from './health-check';

describe('buildHealthStatus', () => {
  const fixedNow = () => new Date('2026-01-01T00:00:00.000Z');

  it('returns status ok when healthy', () => {
    const result = buildHealthStatus('api', true, fixedNow);
    expect(result).toEqual({ status: 'ok', service: 'api', timestamp: '2026-01-01T00:00:00.000Z' });
  });

  it('returns status error when unhealthy', () => {
    const result = buildHealthStatus('api', false, fixedNow);
    expect(result.status).toBe('error');
  });
});
