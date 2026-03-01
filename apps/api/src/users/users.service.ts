import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import type { CountryCode, LanguageCode, Role } from '@zervia/shared';

import { UserEntity, type UserDocument } from './user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(UserEntity.name) private readonly userModel: Model<UserDocument>) {}

  create(input: {
    email: string;
    passwordHash: string;
    roles: Role[];
    country: CountryCode;
    locale: LanguageCode;
  }) {
    return this.userModel.create(input);
  }

  findByEmail(email: string) {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  findById(id: string) {
    return this.userModel.findById(id).exec();
  }

  async updateRefreshTokenHash(userId: string, refreshTokenHash: string | null) {
    await this.userModel
      .findByIdAndUpdate(userId, { refreshTokenHash: refreshTokenHash ?? undefined })
      .exec();
  }
}
