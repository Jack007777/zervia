import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import {
  ROLES,
  SUPPORTED_COUNTRIES,
  SUPPORTED_LANGUAGES,
  type CountryCode,
  type LanguageCode,
  type Role
} from '@zervia/shared';

export type UserDocument = HydratedDocument<UserEntity>;

@Schema({ timestamps: true, collection: 'users' })
export class UserEntity {
  @Prop({ required: false, unique: true, sparse: true, lowercase: true, trim: true })
  email?: string;

  @Prop({ trim: true })
  displayName?: string;

  @Prop({ trim: true, unique: true, sparse: true })
  phone?: string;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop({ type: [String], enum: ROLES, default: ['customer'] })
  roles!: Role[];

  @Prop({ type: String, enum: SUPPORTED_COUNTRIES, default: 'DE' })
  country!: CountryCode;

  @Prop({ type: String, enum: SUPPORTED_LANGUAGES, default: 'de' })
  locale!: LanguageCode;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop()
  refreshTokenHash?: string;
}

export const UserSchema = SchemaFactory.createForClass(UserEntity);
