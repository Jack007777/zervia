import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter;
  private readonly fromAddress: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST') ?? 'smtp.zoho.eu';
    const port = Number(this.configService.get<string>('SMTP_PORT') ?? '465');
    const secure = (this.configService.get<string>('SMTP_SECURE') ?? 'true') === 'true';
    const user = this.configService.get<string>('SMTP_USER') ?? '';
    const pass = this.configService.get<string>('SMTP_PASS') ?? '';
    this.fromAddress = this.configService.get<string>('SMTP_FROM') ?? user;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined
    });
  }

  async sendRegisterVerificationCode(input: { toEmail: string; code: string; locale: 'de' | 'en' }) {
    const subject =
      input.locale === 'de' ? 'Zervia Verifizierungscode' : 'Zervia verification code';
    const text =
      input.locale === 'de'
        ? `Dein Zervia Verifizierungscode ist: ${input.code}. Gueltig fuer 10 Minuten.`
        : `Your Zervia verification code is: ${input.code}. Valid for 10 minutes.`;

    if (!this.fromAddress) {
      this.logger.warn(`SMTP_FROM missing. Verification code for ${input.toEmail}: ${input.code}`);
      return { ok: true, mocked: true };
    }

    await this.transporter.sendMail({
      from: this.fromAddress,
      to: input.toEmail,
      subject,
      text
    });

    this.logger.log(`Email verification sent to ${input.toEmail}`);
    return { ok: true };
  }
}

