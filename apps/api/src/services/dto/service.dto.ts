import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

import { SUPPORTED_COUNTRIES, SUPPORTED_CURRENCIES } from '@zervia/shared';

export class CreateServiceDto {
  @ApiProperty({ example: 'Classic Haircut' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'Wash + cut + styling' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 45 })
  @Type(() => Number)
  @IsNumber()
  @Min(5)
  durationMinutes!: number;

  @ApiProperty({ example: 39.9 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiPropertyOptional({ example: 'EUR' })
  @IsOptional()
  @IsEnum(SUPPORTED_CURRENCIES)
  @IsString()
  currency: (typeof SUPPORTED_CURRENCIES)[number] = 'EUR';

  @ApiPropertyOptional({ enum: SUPPORTED_COUNTRIES, example: 'DE' })
  @IsOptional()
  @IsEnum(SUPPORTED_COUNTRIES)
  country: (typeof SUPPORTED_COUNTRIES)[number] = 'DE';

  @ApiPropertyOptional({ example: 'hair' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'staff_123' })
  @IsOptional()
  @IsString()
  staffId?: string;

  @ApiPropertyOptional({ example: 19 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  vatRate?: number;
}

export class UpdateServiceDto extends PartialType(CreateServiceDto) {}

export class ListServicesQueryDto {
  @ApiPropertyOptional({ enum: SUPPORTED_COUNTRIES, example: 'DE' })
  @IsOptional()
  @IsEnum(SUPPORTED_COUNTRIES)
  country: (typeof SUPPORTED_COUNTRIES)[number] = 'DE';
}
