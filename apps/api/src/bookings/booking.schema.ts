import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import {
  SUPPORTED_COUNTRIES,
  SUPPORTED_CURRENCIES,
  TIMEZONE,
  type CountryCode,
  type CurrencyCode
} from '@zervia/shared';

export type BookingDocument = HydratedDocument<BookingEntity>;

@Schema({ timestamps: true, collection: 'bookings' })
export class BookingEntity {
  @Prop({ required: true })
  customerUserId!: string;

  @Prop({ required: true })
  businessId!: string;

  @Prop({ required: true })
  serviceId!: string;

  @Prop({ required: true, default: 'default' })
  staffId!: string;

  @Prop({ type: Date, required: true, index: true })
  startTime!: Date;

  @Prop({ type: Date, required: true, index: true })
  endTime!: Date;

  @Prop({ default: 'pending', enum: ['pending', 'confirmed', 'cancelled', 'completed'] })
  status!: 'pending' | 'confirmed' | 'cancelled' | 'completed';

  @Prop()
  notes?: string;

  @Prop()
  cancelReason?: string;

  @Prop({ type: String, enum: SUPPORTED_COUNTRIES, default: 'DE' })
  country!: CountryCode;

  @Prop({ type: String, enum: SUPPORTED_CURRENCIES, default: 'EUR' })
  currency!: CurrencyCode;

  @Prop({ type: Number })
  vatRate?: number;

  @Prop({ type: Number })
  vatAmount?: number;

  @Prop({ default: TIMEZONE })
  timezone!: string;
}

export const BookingSchema = SchemaFactory.createForClass(BookingEntity);
BookingSchema.index({ businessId: 1, status: 1, startTime: 1, endTime: 1 });
BookingSchema.index({ businessId: 1, staffId: 1, status: 1, startTime: 1, endTime: 1 });
BookingSchema.index({ businessId: 1, staffId: 1, startTime: 1 }, { unique: true });
