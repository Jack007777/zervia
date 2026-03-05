import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import type { JwtPayload, Role } from '@zervia/shared';

import { EmailService } from '../notifications/email.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService
  ) {}

  async register(input: {
    email: string;
    password: string;
    roles: Role[];
    country: 'DE';
    locale: 'de' | 'en';
  }) {
    const email = input.email?.trim().toLowerCase();
    if (!email) {
      throw new UnauthorizedException('Email is required');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const created = await this.usersService.createOrRefreshEmailVerificationChallenge({
      email,
      passwordHash,
      roles: input.roles,
      country: input.country,
      locale: input.locale,
      code,
      expiresAt
    });

    if (!created.ok) {
      throw new UnauthorizedException('Email already exists');
    }

    await this.emailService.sendRegisterVerificationCode({
      toEmail: email,
      code,
      locale: input.locale
    });

    return {
      verificationRequired: true,
      channel: 'email' as const,
      identifier: email
    };
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive && user.manualPhoneApprovalPending) {
      throw new UnauthorizedException('PHONE_REGISTRATION_PENDING_REVIEW');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('ACCOUNT_DISABLED');
    }

    if (user.email && !user.emailVerified) {
      throw new UnauthorizedException('EMAIL_NOT_VERIFIED');
    }

    return this.issueTokens(user.id, user.email ?? user.phone ?? 'user', user.roles, user.country);
  }

  async verifyEmailRegistration(email: string, code: string) {
    const result = await this.usersService.verifyEmailCode(email, code);
    if (!result.ok) {
      throw new BadRequestException(result.reason);
    }

    const user = result.user;
    return this.issueTokens(user.id, user.email ?? user.phone ?? 'user', user.roles, user.country);
  }

  async refresh(refreshToken: string) {
    const decoded = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
      secret:
        this.configService.get<string>('REFRESH_SECRET') ??
        this.configService.getOrThrow<string>('JWT_REFRESH_SECRET')
    });
    const userId = decoded.sub;
    const user = await this.usersService.findById(userId);
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh');
    }
    const valid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid refresh');
    }

    return this.issueTokens(user.id, user.email ?? user.phone ?? 'user', user.roles, user.country);
  }

  async logout(userId: string, refreshToken: string) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Invalid logout');
    }
    const valid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid logout');
    }
    await this.usersService.updateRefreshTokenHash(user.id, null);
    return { success: true };
  }

  async me(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      userId: user.id,
      email: user.email,
      phone: user.phone,
      roles: user.roles,
      country: user.country,
      locale: user.locale,
      phoneVerified: Boolean(user.phoneVerified)
    };
  }

  async requestManualPhoneVerification(userId: string, phoneInput: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const phone = phoneInput?.trim();
    if (!phone) {
      throw new BadRequestException('Phone is required');
    }

    const existingByPhone = await this.usersService.findByPhone(phone);
    if (existingByPhone && existingByPhone.id !== userId) {
      throw new BadRequestException('Phone already used by another account');
    }

    await this.usersService.requestManualPhoneVerification(userId, phone);
    return {
      success: true,
      status: 'pending_manual_review',
      message: 'Send SMS "verify" from this phone number to your admin number, then wait for manual approval.'
    };
  }

  private async issueTokens(userId: string, email: string, roles: Role[], country: 'DE') {
    const user = await this.usersService.findById(userId);
    const payload: JwtPayload = {
      sub: userId,
      email,
      roles,
      country,
      phoneVerified: Boolean(user?.phoneVerified)
    };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret:
        this.configService.get<string>('JWT_SECRET') ??
        this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: (this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m') as never
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret:
        this.configService.get<string>('REFRESH_SECRET') ??
        this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d') as never
    });
    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);
    await this.usersService.updateRefreshTokenHash(userId, refreshTokenHash);

    return {
      userId,
      tokens: {
        accessToken,
        refreshToken
      }
    };
  }
}
