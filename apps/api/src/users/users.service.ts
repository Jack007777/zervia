import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';

import type { CountryCode, LanguageCode, Role } from '@zervia/shared';

import { UserEntity, type UserDocument } from './user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(UserEntity.name) private readonly userModel: Model<UserDocument>) {}

  create(input: {
    email?: string;
    phone?: string;
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

  findByPhone(phone: string) {
    return this.userModel.findOne({ phone: phone.trim() }).exec();
  }

  async findByIdentifier(identifier: string) {
    const value = identifier.trim();
    if (!value) {
      return null;
    }

    if (value.includes('@')) {
      return this.findByEmail(value);
    }
    return this.findByPhone(value);
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

  async createPhoneVerificationChallenge(userId: string, phone: string, code: string, expiresAt: Date) {
    const codeHash = await bcrypt.hash(code, 10);
    await this.userModel
      .findByIdAndUpdate(userId, {
        phone: phone.trim(),
        phoneVerified: false,
        phoneVerificationCodeHash: codeHash,
        phoneVerificationExpiresAt: expiresAt
      })
      .exec();
  }

  async verifyPhoneCode(userId: string, code: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user || !user.phoneVerificationCodeHash || !user.phoneVerificationExpiresAt) {
      return { ok: false as const, reason: 'NO_PENDING_VERIFICATION' };
    }

    if (user.phoneVerificationExpiresAt.getTime() < Date.now()) {
      return { ok: false as const, reason: 'CODE_EXPIRED' };
    }

    const valid = await bcrypt.compare(code, user.phoneVerificationCodeHash);
    if (!valid) {
      return { ok: false as const, reason: 'INVALID_CODE' };
    }

    user.phoneVerified = true;
    user.phoneVerificationCodeHash = undefined;
    user.phoneVerificationExpiresAt = undefined;
    await user.save();
    return { ok: true as const };
  }
}
