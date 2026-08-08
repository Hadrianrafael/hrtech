import { describe, it, expect } from 'vitest';
import { isHealthStatus } from './health';

describe('isHealthStatus', () => {
  it('returns true for a valid health status object', () => {
    expect(
      isHealthStatus({ status: 'ok', service: 'api', timestamp: '2026-01-01T00:00:00.000Z' }),
    ).toBe(true);
  });

  it('returns false when status is not ok or error', () => {
    expect(
      isHealthStatus({ status: 'pending', service: 'api', timestamp: '2026-01-01T00:00:00.000Z' }),
    ).toBe(false);
  });

  it('returns false for null', () => {
    expect(isHealthStatus(null)).toBe(false);
  });

  it('returns false when required fields are missing', () => {
    expect(isHealthStatus({ status: 'ok' })).toBe(false);
  });
});
