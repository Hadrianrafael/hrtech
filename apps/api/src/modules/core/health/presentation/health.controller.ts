import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { GetReadinessUseCase } from '../application/get-readiness.use-case';
import { buildHealthStatus } from '../domain/health-check';

@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly getReadiness: GetReadinessUseCase) {}

  @Get('live')
  live() {
    return buildHealthStatus('api', true);
  }

  @Get('ready')
  async ready() {
    const status = await this.getReadiness.execute();
    if (status.status === 'error') {
      throw new ServiceUnavailableException(status);
    }
    return status;
  }

  @Get()
  async check() {
    return this.ready();
  }
}
