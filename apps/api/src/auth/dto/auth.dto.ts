import {
  IsBoolean,
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  Matches
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { ROLES, SUPPORTED_COUNTRIES, SUPPORTED_LANGUAGES } from '@zervia/shared';

export class RegisterDto {
  @ApiProperty({ example: 'owner@zervia.eu' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'StrongPass123!' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({ enum: ROLES, isArray: true, example: ['business'] })
  @IsArray()
  @IsEnum(ROLES, { each: true })
  roles: (typeof ROLES)[number][] = ['customer'];

  @ApiPropertyOptional({ enum: SUPPORTED_COUNTRIES, example: 'DE' })
  @IsOptional()
  @IsEnum(SUPPORTED_COUNTRIES)
  country: (typeof SUPPORTED_COUNTRIES)[number] = 'DE';

  @ApiPropertyOptional({ enum: SUPPORTED_LANGUAGES, example: 'de' })
  @IsOptional()
  @IsEnum(SUPPORTED_LANGUAGES)
  locale: (typeof SUPPORTED_LANGUAGES)[number] = 'de';
}

export class RegisterVerifyEmailDto {
  @ApiProperty({ example: 'owner@zervia.eu' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(4)
  code!: string;
}

export class LoginDto {
  @ApiProperty({ example: 'owner@zervia.eu' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'StrongPass123!' })
  @IsString()
  password!: string;
}

export class RefreshDto {
  @ApiProperty({ example: 'refresh-jwt-token' })
  @IsString()
  refreshToken!: string;
}

export class LogoutDto {
  @ApiProperty({ example: 'refresh-jwt-token' })
  @IsString()
  refreshToken!: string;
}

export class PhoneSendCodeDto {
  @ApiProperty({ example: '+4917612345678' })
  @IsString()
  @Matches(/^\+?[1-9]\d{6,14}$/)
  phone!: string;
}

export class AuthMeDto {
  @ApiProperty()
  userId!: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiProperty({ type: [String], enum: ROLES })
  roles!: (typeof ROLES)[number][];

  @ApiProperty({ enum: SUPPORTED_COUNTRIES })
  country!: (typeof SUPPORTED_COUNTRIES)[number];

  @ApiProperty({ enum: SUPPORTED_LANGUAGES })
  locale!: (typeof SUPPORTED_LANGUAGES)[number];

  @ApiProperty()
  @IsBoolean()
  phoneVerified!: boolean;
}
