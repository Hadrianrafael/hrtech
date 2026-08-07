import { Injectable } from '@nestjs/common';
import type { HealthStatus } from '@hrtech/types';
import { PrismaService } from '../../../../infra/prisma/prisma.service';
import { buildHealthStatus } from '../domain/health-check';

@Injectable()
export class GetReadinessUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(): Promise<HealthStatus> {
    const dbHealthy = await this.prisma.isHealthy();
    return buildHealthStatus('api', dbHealthy);
  }
}
