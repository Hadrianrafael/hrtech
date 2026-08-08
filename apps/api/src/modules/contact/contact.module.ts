import { Module } from '@nestjs/common';
import { ContactController } from './presentation/contact.controller';
import { SubmitContactUseCase } from './application/submit-contact.use-case';
import { AzureEmailService } from './infrastructure/azure-email.service';
import { EMAIL_PORT } from './infrastructure/email.port';

@Module({
  controllers: [ContactController],
  providers: [SubmitContactUseCase, { provide: EMAIL_PORT, useClass: AzureEmailService }],
})
export class ContactModule {}
