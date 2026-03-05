import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Matches,
  Min,
  MinLength,
  ValidateNested
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

import { SUPPORTED_COUNTRIES, SUPPORTED_CURRENCIES } from '@zervia/shared';

const SUPPORTED_BOOKING_MODES = ['instant', 'request'] as const;

export class LocationDto {
  @ApiProperty({ example: 52.52 })
  @IsNumber()
  lat!: number;

  @ApiProperty({ example: 13.405 })
  @IsNumber()
  lng!: number;

  @ApiProperty({ example: 'Alexanderplatz 1, Berlin' })
  @IsString()
  addressLine!: string;
}

export class CreateBusinessDto {
  @ApiProperty({ example: 'Zervia Studio Berlin' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional({ example: 'Premium beauty studio in Mitte' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'beauty' })
  @IsString()
  category!: string;

  @ApiProperty({ type: LocationDto })
  @ValidateNested()
  @Type(() => LocationDto)
  location!: LocationDto;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  priceMin?: number;

  @ApiPropertyOptional({ example: 80 })
  @IsOptional()
  @IsNumber()
  priceMax?: number;

  @ApiPropertyOptional({ example: 4.6, minimum: 0, maximum: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ enum: SUPPORTED_BOOKING_MODES, example: 'instant' })
  @IsOptional()
  @IsEnum(SUPPORTED_BOOKING_MODES)
  bookingMode?: (typeof SUPPORTED_BOOKING_MODES)[number];

  @ApiPropertyOptional({ example: '+49301234567' })
  @IsOptional()
  @Matches(/^\+?[0-9\s-]{7,20}$/)
  contactPhone?: string;

  @ApiPropertyOptional({ example: ['de', 'en'], isArray: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supportedLanguages?: string[];

  @ApiPropertyOptional({ enum: SUPPORTED_CURRENCIES, example: 'EUR' })
  @IsOptional()
  @IsEnum(SUPPORTED_CURRENCIES)
  defaultCurrency: (typeof SUPPORTED_CURRENCIES)[number] = 'EUR';

  @ApiPropertyOptional({ example: 'DE123456789' })
  @IsOptional()
  @IsString()
  vatNumber?: string;

  @ApiPropertyOptional({ example: 19 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  vatRate?: number;

  @IsOptional()
  @ApiPropertyOptional({ enum: SUPPORTED_COUNTRIES, example: 'DE' })
  @IsEnum(SUPPORTED_COUNTRIES)
  country: (typeof SUPPORTED_COUNTRIES)[number] = 'DE';
}

export class UpdateBusinessDto extends PartialType(CreateBusinessDto) {}

export class SearchQueryDto {
  @ApiPropertyOptional({ enum: SUPPORTED_COUNTRIES, example: 'DE' })
  @IsOptional()
  @IsEnum(SUPPORTED_COUNTRIES)
  country: (typeof SUPPORTED_COUNTRIES)[number] = 'DE';

  @ApiPropertyOptional({ example: 52.52 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({ example: 13.405 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  radiusKm?: number;

  @ApiPropertyOptional({ example: 'beauty' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'Berlin' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: '10115' })
  @IsOptional()
  @IsString()
  zip?: string;

  @ApiPropertyOptional({ example: '10115' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ example: 'nail' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  priceMin?: number;

  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  priceMax?: number;

  @ApiPropertyOptional({ example: 4.2, minimum: 0, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  ratingMin?: number;
}
