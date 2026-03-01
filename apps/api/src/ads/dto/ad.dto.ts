import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, IsUrl, Max, Min } from 'class-validator';

import { SUPPORTED_COUNTRIES, SUPPORTED_CURRENCIES, type CountryCode, type CurrencyCode } from '@zervia/shared';

export class CreateAdDto {
  @ApiProperty()
  @IsString()
  businessId!: string;

  @ApiProperty()
  @IsString()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  landingUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiPropertyOptional({ enum: SUPPORTED_COUNTRIES, default: 'DE' })
  @IsOptional()
  @IsEnum(SUPPORTED_COUNTRIES)
  country?: CountryCode;

  @ApiPropertyOptional({ enum: SUPPORTED_CURRENCIES, default: 'EUR' })
  @IsOptional()
  @IsEnum(SUPPORTED_CURRENCIES)
  currency?: CurrencyCode;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 2000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(2000)
  budgetDaily?: number;
}

export class UpdateAdStatusDto {
  @ApiProperty({ enum: ['pending', 'approved', 'rejected', 'paused', 'active'] })
  @IsEnum(['pending', 'approved', 'rejected', 'paused', 'active'])
  status!: 'pending' | 'approved' | 'rejected' | 'paused' | 'active';
}

