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
    isActive?: boolean;
    phoneVerified?: boolean;
    manualPhoneApprovalPending?: boolean;
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
      .select('email roles country locale isActive displayName phone phoneVerified manualPhoneApprovalPending createdAt updatedAt')
      .lean()
      .exec();
  }

  async updateAdminUser(
    userId: string,
    input: { roles?: Role[]; isActive?: boolean; phoneVerified?: boolean; manualPhoneApprovalPending?: boolean }
  ) {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        {
          ...(input.roles ? { roles: input.roles } : {}),
          ...(typeof input.isActive === 'boolean' ? { isActive: input.isActive } : {}),
          ...(typeof input.phoneVerified === 'boolean' ? { phoneVerified: input.phoneVerified } : {}),
          ...(typeof input.manualPhoneApprovalPending === 'boolean'
            ? { manualPhoneApprovalPending: input.manualPhoneApprovalPending }
            : {})
        },
        { new: true }
      )
      .select('email roles country locale isActive displayName phone phoneVerified manualPhoneApprovalPending createdAt updatedAt')
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

  async requestManualPhoneVerification(userId: string, phone: string) {
    await this.userModel
      .findByIdAndUpdate(userId, {
        phone: phone.trim(),
        phoneVerified: false,
        manualPhoneApprovalPending: true,
        phoneVerificationCodeHash: undefined,
        phoneVerificationExpiresAt: undefined
      })
      .exec();
  }

  async createOrRefreshEmailVerificationChallenge(input: {
    email: string;
    passwordHash: string;
    roles: Role[];
    country: CountryCode;
    locale: LanguageCode;
    code: string;
    expiresAt: Date;
  }) {
    const email = input.email.trim().toLowerCase();
    const existing = await this.userModel.findOne({ email }).exec();
    const codeHash = await bcrypt.hash(input.code, 10);

    if (existing) {
      if (existing.emailVerified) {
        return { ok: false as const, reason: 'EMAIL_ALREADY_EXISTS' };
      }

      existing.passwordHash = input.passwordHash;
      existing.roles = input.roles;
      existing.country = input.country;
      existing.locale = input.locale;
      existing.emailVerificationCodeHash = codeHash;
      existing.emailVerificationExpiresAt = input.expiresAt;
      existing.emailVerified = false;
      await existing.save();
      return { ok: true as const, userId: existing.id };
    }

    const created = await this.userModel.create({
      email,
      passwordHash: input.passwordHash,
      roles: input.roles,
      country: input.country,
      locale: input.locale,
      emailVerified: false,
      emailVerificationCodeHash: codeHash,
      emailVerificationExpiresAt: input.expiresAt
    });
    return { ok: true as const, userId: created.id };
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

  async verifyEmailCode(emailInput: string, code: string) {
    const email = emailInput.trim().toLowerCase();
    const user = await this.userModel.findOne({ email }).exec();
    if (!user || !user.emailVerificationCodeHash || !user.emailVerificationExpiresAt) {
      return { ok: false as const, reason: 'NO_PENDING_VERIFICATION' };
    }

    if (user.emailVerificationExpiresAt.getTime() < Date.now()) {
      return { ok: false as const, reason: 'CODE_EXPIRED' };
    }

    const valid = await bcrypt.compare(code, user.emailVerificationCodeHash);
    if (!valid) {
      return { ok: false as const, reason: 'INVALID_CODE' };
    }

    user.emailVerified = true;
    user.emailVerificationCodeHash = undefined;
    user.emailVerificationExpiresAt = undefined;
    await user.save();
    return { ok: true as const, user };
  }
}
