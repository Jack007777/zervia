import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import {
  SUPPORTED_COUNTRIES,
  SUPPORTED_CURRENCIES,
  TIMEZONE,
  type CountryCode,
  type CurrencyCode
} from '@zervia/shared';

export type BusinessDocument = HydratedDocument<BusinessEntity>;

@Schema({ timestamps: true, collection: 'businesses' })
export class BusinessEntity {
  @Prop({ required: true })
  ownerUserId!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ trim: true })
  category?: string;

  @Prop({ required: true })
  city!: string;

  @Prop({ required: true })
  addressLine!: string;

  @Prop({ type: String, enum: SUPPORTED_COUNTRIES, default: 'DE' })
  country!: CountryCode;

  @Prop({ type: String, enum: SUPPORTED_CURRENCIES, default: 'EUR' })
  defaultCurrency!: CurrencyCode;

  @Prop()
  vatNumber?: string;

  @Prop({ type: Number })
  vatRate?: number;

  @Prop({ default: TIMEZONE })
  timezone!: string;

  @Prop({ type: Number })
  lat?: number;

  @Prop({ type: Number })
  lng?: number;

  @Prop({ type: Number })
  priceMin?: number;

  @Prop({ type: Number })
  priceMax?: number;

  @Prop({ type: Number })
  rating?: number;

  @Prop({ default: 'instant', enum: ['instant', 'request'] })
  bookingMode!: 'instant' | 'request';

  @Prop({ default: false })
  requireVerifiedPhoneForBooking!: boolean;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ type: Date })
  archivedAt?: Date;

  @Prop({ type: Date, index: true })
  deletionScheduledAt?: Date;

  @Prop({ default: false, index: true })
  isVirtual!: boolean;

  @Prop({ trim: true, index: true })
  virtualSeedBatch?: string;
}

export const BusinessSchema = SchemaFactory.createForClass(BusinessEntity);
