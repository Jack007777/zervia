import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { EmailService } from './email.service';
import { SmsService } from './sms.service';

@Module({
  imports: [ConfigModule],
  providers: [SmsService, EmailService],
  exports: [SmsService, EmailService]
})
export class NotificationsModule {}
