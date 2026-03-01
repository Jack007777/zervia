import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import {
  SUPPORTED_COUNTRIES,
  SUPPORTED_CURRENCIES,
  type CountryCode,
  type CurrencyCode
} from '@zervia/shared';

export type AdDocument = HydratedDocument<AdEntity>;

@Schema({ timestamps: true, collection: 'ads' })
export class AdEntity {
  @Prop({ required: true })
  businessId!: string;

  @Prop({ required: true })
  createdByUserId!: string;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ trim: true })
  landingUrl?: string;

  @Prop({ trim: true })
  imageUrl?: string;

  @Prop({ type: String, enum: SUPPORTED_COUNTRIES, default: 'DE' })
  country!: CountryCode;

  @Prop({ type: String, enum: SUPPORTED_CURRENCIES, default: 'EUR' })
  currency!: CurrencyCode;

  @Prop({ type: Number, default: 20 })
  budgetDaily!: number;

  @Prop({ type: String, enum: ['pending', 'approved', 'rejected', 'paused', 'active'], default: 'pending' })
  status!: 'pending' | 'approved' | 'rejected' | 'paused' | 'active';

  @Prop({ type: Date })
  startsAt?: Date;

  @Prop({ type: Date })
  endsAt?: Date;

  @Prop({ type: Number, default: 0 })
  impressions!: number;

  @Prop({ type: Number, default: 0 })
  clicks!: number;
}

export const AdSchema = SchemaFactory.createForClass(AdEntity);
AdSchema.index({ businessId: 1, status: 1, createdAt: -1 });
AdSchema.index({ country: 1, status: 1, createdAt: -1 });
AdSchema.index({ createdByUserId: 1, createdAt: -1 });

