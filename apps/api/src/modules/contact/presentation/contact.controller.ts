import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SubmitContactUseCase } from '../application/submit-contact.use-case';
import { SubmitContactDto } from './submit-contact.dto';

@Controller('contact')
export class ContactController {
  constructor(private readonly submitContact: SubmitContactUseCase) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async submit(@Body() dto: SubmitContactDto): Promise<void> {
    await this.submitContact.execute(dto);
  }
}
