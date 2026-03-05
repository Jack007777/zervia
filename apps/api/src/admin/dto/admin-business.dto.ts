import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

const SUPPORTED_BOOKING_MODES = ['instant', 'request'] as const;

export class UpdateAdminBusinessDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  addressLine?: string;

  @ApiPropertyOptional({ enum: SUPPORTED_BOOKING_MODES })
  @IsOptional()
  @IsEnum(SUPPORTED_BOOKING_MODES)
  bookingMode?: (typeof SUPPORTED_BOOKING_MODES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
