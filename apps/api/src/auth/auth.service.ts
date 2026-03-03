import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import type { JwtPayload, Role } from '@zervia/shared';

import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async register(input: {
    email?: string;
    phone?: string;
    password: string;
    roles: Role[];
    country: 'DE';
    locale: 'de' | 'en';
  }) {
    const email = input.email?.trim().toLowerCase();
    const phone = input.phone?.trim();
    if (!email && !phone) {
      throw new UnauthorizedException('Email or phone is required');
    }

    if (email) {
      const existingByEmail = await this.usersService.findByEmail(email);
      if (existingByEmail) {
        throw new UnauthorizedException('Email already exists');
      }
    }

    if (phone) {
      const existingByPhone = await this.usersService.findByPhone(phone);
      if (existingByPhone) {
        throw new UnauthorizedException('Phone already exists');
      }
    }
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await this.usersService.create({
      email,
      phone,
      passwordHash,
      roles: input.roles,
      country: input.country,
      locale: input.locale
    });

    return this.issueTokens(user.id, user.email ?? user.phone ?? 'user', user.roles, user.country);
  }

  async login(identifier: string, password: string) {
    const user = await this.usersService.findByIdentifier(identifier);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

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

  private async issueTokens(userId: string, email: string, roles: Role[], country: 'DE') {
    const payload: JwtPayload = {
      sub: userId,
      email,
      roles,
      country
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
