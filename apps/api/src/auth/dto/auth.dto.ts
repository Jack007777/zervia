import { IsArray, IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
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
