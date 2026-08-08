export type ServiceStatus = 'ok' | 'error';

export interface HealthStatus {
  status: ServiceStatus;
  service: string;
  timestamp: string;
}

export function isHealthStatus(value: unknown): value is HealthStatus {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    (v.status === 'ok' || v.status === 'error') &&
    typeof v.service === 'string' &&
    typeof v.timestamp === 'string'
  );
}
