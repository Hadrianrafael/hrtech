import { Module } from '@nestjs/common';
import { HealthController } from './presentation/health.controller';
import { GetReadinessUseCase } from './application/get-readiness.use-case';
import { PrismaModule } from '../../../infra/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HealthController],
  providers: [GetReadinessUseCase],
})
export class HealthModule {}
