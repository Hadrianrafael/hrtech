import { isHealthStatus, type HealthStatus } from '@hrtech/types';

export async function getApiHealth(): Promise<HealthStatus> {
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001';

  try {
    const res = await fetch(`${apiUrl}/health/ready`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    const data: unknown = await res.json();
    return isHealthStatus(data) ? data : errorStatus();
  } catch {
    return errorStatus();
  }
}

function errorStatus(): HealthStatus {
  return { status: 'error', service: 'api', timestamp: new Date().toISOString() };
}
