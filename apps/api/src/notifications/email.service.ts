import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter;
  private readonly fromAddress: string;
  private readonly deliveryTimeoutMs: number;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST') ?? 'smtp.zoho.eu';
    const port = Number(this.configService.get<string>('SMTP_PORT') ?? '465');
    const secure = (this.configService.get<string>('SMTP_SECURE') ?? 'true') === 'true';
    const user = this.configService.get<string>('SMTP_USER') ?? '';
    const pass = this.configService.get<string>('SMTP_PASS') ?? '';
    this.fromAddress = this.configService.get<string>('SMTP_FROM') ?? user;
    this.deliveryTimeoutMs = Number(
      this.configService.get<string>('SMTP_DELIVERY_TIMEOUT_MS') ?? '5000'
    );
    const connectionTimeout = Number(
      this.configService.get<string>('SMTP_CONNECTION_TIMEOUT_MS') ?? '3000'
    );
    const greetingTimeout = Number(
      this.configService.get<string>('SMTP_GREETING_TIMEOUT_MS') ?? '3000'
    );
    const socketTimeout = Number(
      this.configService.get<string>('SMTP_SOCKET_TIMEOUT_MS') ?? '5000'
    );

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
      connectionTimeout,
      greetingTimeout,
      socketTimeout
    });
  }

  async sendRegisterVerificationLink(input: {
    toEmail: string;
    verificationUrl: string;
    locale: 'de' | 'en';
  }) {
    const subject =
      input.locale === 'de' ? 'Bestaetige deine Zervia E-Mail-Adresse' : 'Verify your Zervia email address';
    const text =
      input.locale === 'de'
        ? `Klicke auf diesen Link, um deine Zervia Registrierung abzuschliessen: ${input.verificationUrl}

Dieser Link ist 10 Minuten gueltig.

Falls diese E-Mail an die falsche Person gesendet wurde, ignoriere sie bitte.`
        : `Click this link to complete your Zervia registration: ${input.verificationUrl}

This link is valid for 10 minutes.

If this email reached the wrong person, please ignore it.`;

    if (!this.fromAddress) {
      this.logger.error(`SMTP_FROM missing. Cannot send verification email to ${input.toEmail}.`);
      throw new ServiceUnavailableException('EMAIL_SERVICE_NOT_CONFIGURED');
    }

    try {
      await Promise.race([
        this.transporter.sendMail({
          from: this.fromAddress,
          to: input.toEmail,
          subject,
          text
        }),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('SMTP_DELIVERY_TIMEOUT')), this.deliveryTimeoutMs);
        })
      ]);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send verification email to ${input.toEmail}: ${reason}`);
      throw new ServiceUnavailableException('EMAIL_DELIVERY_FAILED');
    }

    this.logger.log(`Email verification link sent to ${input.toEmail}`);
    return { ok: true };
  }
}
