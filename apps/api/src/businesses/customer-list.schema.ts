import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { SUPPORTED_COUNTRIES, type CountryCode } from '@zervia/shared';

export type BusinessCustomerListDocument = HydratedDocument<BusinessCustomerListEntity>;

@Schema({ timestamps: true, collection: 'business_customer_lists' })
export class BusinessCustomerListEntity {
  @Prop({ required: true, index: true })
  businessId!: string;

  @Prop({ required: true, trim: true, index: true })
  phone!: string;

  @Prop({ trim: true })
  customName?: string;

  @Prop({ default: 'none', enum: ['none', 'whitelist', 'blacklist'] })
  listType!: 'none' | 'whitelist' | 'blacklist';

  @Prop({ trim: true })
  note?: string;

  @Prop({ type: String, enum: SUPPORTED_COUNTRIES, default: 'DE' })
  country!: CountryCode;
}

export const BusinessCustomerListSchema = SchemaFactory.createForClass(BusinessCustomerListEntity);
BusinessCustomerListSchema.index({ businessId: 1, phone: 1 }, { unique: true });

