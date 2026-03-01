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

  listForAdmin(limit = 50) {
    return this.userModel
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('email roles country locale isActive displayName phone createdAt updatedAt')
      .lean()
      .exec();
  }

  async updateAdminUser(userId: string, input: { roles?: Role[]; isActive?: boolean }) {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        {
          ...(input.roles ? { roles: input.roles } : {}),
          ...(typeof input.isActive === 'boolean' ? { isActive: input.isActive } : {})
        },
        { new: true }
      )
      .select('email roles country locale isActive displayName phone createdAt updatedAt')
      .lean()
      .exec();
  }

  async updateRefreshTokenHash(userId: string, refreshTokenHash: string | null) {
    await this.userModel
      .findByIdAndUpdate(userId, { refreshTokenHash: refreshTokenHash ?? undefined })
      .exec();
  }
}
