import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

import { SUPPORTED_COUNTRIES } from '@zervia/shared';

export class CreateBookingDto {
  @ApiProperty({ example: 'biz_123' })
  @IsString()
  businessId!: string;

  @ApiProperty({ example: 'svc_123' })
  @IsString()
  serviceId!: string;

  @ApiPropertyOptional({ example: 'staff_123' })
  @IsOptional()
  @IsString()
  staffId?: string;

  @ApiProperty({ example: '2026-03-20T09:00:00+01:00' })
  @IsDateString()
  startTime!: string;

  @ApiPropertyOptional({ example: 'Please call before visit' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ enum: SUPPORTED_COUNTRIES, example: 'DE' })
  @IsOptional()
  @IsEnum(SUPPORTED_COUNTRIES)
  country: (typeof SUPPORTED_COUNTRIES)[number] = 'DE';
}

export class CancelBookingDto {
  @ApiPropertyOptional({ example: 'Need to reschedule' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ConfirmBookingDto {
  @ApiPropertyOptional({ example: 'staff_123' })
  @IsOptional()
  @IsString()
  staffId?: string;

  @ApiPropertyOptional({ example: 'Arrive 10 min earlier' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class ListBookingsQueryDto {
  @ApiPropertyOptional({ enum: SUPPORTED_COUNTRIES, example: 'DE' })
  @IsOptional()
  @IsEnum(SUPPORTED_COUNTRIES)
  country: (typeof SUPPORTED_COUNTRIES)[number] = 'DE';
}
