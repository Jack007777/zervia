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
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop({ type: [String], enum: ROLES, default: ['customer'] })
  roles!: Role[];

  @Prop({ type: String, enum: SUPPORTED_COUNTRIES, default: 'DE' })
  country!: CountryCode;

  @Prop({ type: String, enum: SUPPORTED_LANGUAGES, default: 'de' })
  locale!: LanguageCode;

  @Prop()
  refreshTokenHash?: string;
}

export const UserSchema = SchemaFactory.createForClass(UserEntity);
