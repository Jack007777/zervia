import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import {
  SUPPORTED_COUNTRIES,
  SUPPORTED_CURRENCIES,
  type CountryCode,
  type CurrencyCode
} from '@zervia/shared';

export type ServiceDocument = HydratedDocument<ServiceEntity>;

@Schema({ timestamps: true, collection: 'services' })
export class ServiceEntity {
  @Prop({ required: true, index: true })
  businessId!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ required: true, min: 5 })
  durationMinutes!: number;

  @Prop({ required: true, min: 0 })
  price!: number;

  @Prop({ type: String, enum: SUPPORTED_CURRENCIES, default: 'EUR' })
  currency!: CurrencyCode;

  @Prop({ type: Number })
  vatRate?: number;

  @Prop()
  category?: string;

  @Prop()
  staffId?: string;

  @Prop({ type: String, enum: SUPPORTED_COUNTRIES, default: 'DE' })
  country!: CountryCode;
}

export const ServiceSchema = SchemaFactory.createForClass(ServiceEntity);
ServiceSchema.index({ businessId: 1, staffId: 1 });
