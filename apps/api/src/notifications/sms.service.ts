import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  async sendBookingUpdate(input: {
    toPhone: string;
    event: 'created' | 'confirmed' | 'cancelled' | 'counter_proposed' | 'rejected';
    bookingId: string;
    startTime: string;
  }) {
    // TODO: Wire provider (Twilio/MessageBird). Keeping this API stable for future provider swap.
    this.logger.log(
      `SMS(${input.event}) => ${input.toPhone} booking=${input.bookingId} start=${input.startTime}`
    );
    return { ok: true };
  }

  async sendVerificationCode(input: { toPhone: string; code: string }) {
    this.logger.log(`SMS(verification) => ${input.toPhone} code=${input.code}`);
    return { ok: true };
  }
}
