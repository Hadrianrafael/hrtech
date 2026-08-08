import type { HealthStatus } from '@hrtech/types';

export function buildHealthStatus(
  service: string,
  isHealthy: boolean,
  now: () => Date = () => new Date(),
): HealthStatus {
  return {
    status: isHealthy ? 'ok' : 'error',
    service,
    timestamp: now().toISOString(),
  };
}
