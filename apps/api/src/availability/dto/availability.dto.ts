import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  Matches,
  Max,
  Min,
  IsString,
  ValidateNested
} from 'class-validator';

export class AvailabilityWindowDto {
  @ApiProperty({ example: '09:00' })
  @IsString()
  start!: string;

  @ApiProperty({ example: '17:00' })
  @IsString()
  end!: string;
}

export class WeeklyAvailabilityDto {
  @ApiProperty({ example: 1, description: '1=Mon ... 7=Sun' })
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek!: number;

  @ApiPropertyOptional({ example: 'staff_123' })
  @IsOptional()
  @IsString()
  staffId?: string;

  @ApiProperty({ type: [AvailabilityWindowDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AvailabilityWindowDto)
  windows!: AvailabilityWindowDto[];
}

export class SpecialDateOverrideDto {
  @ApiProperty({ example: '2026-03-01' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date!: string;

  @ApiPropertyOptional({ example: 'staff_123' })
  @IsOptional()
  @IsString()
  staffId?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isClosed?: boolean;

  @ApiPropertyOptional({ type: [AvailabilityWindowDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilityWindowDto)
  windows?: AvailabilityWindowDto[];
}

export class PutAvailabilityDto {
  @ApiProperty({ type: [WeeklyAvailabilityDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WeeklyAvailabilityDto)
  weeklySchedule!: WeeklyAvailabilityDto[];

  @ApiPropertyOptional({ type: [SpecialDateOverrideDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpecialDateOverrideDto)
  specialDateOverrides?: SpecialDateOverrideDto[];

  @ApiPropertyOptional({ example: 'Europe/Berlin' })
  @IsOptional()
  @IsString()
  timezone: string = 'Europe/Berlin';
}

export class SlotsQueryDto {
  @ApiProperty({ example: 'svc_123' })
  @IsString()
  serviceId!: string;

  @ApiProperty({ example: '2026-03-20' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date!: string;

  @ApiPropertyOptional({ example: 'staff_123' })
  @IsOptional()
  @IsString()
  staffId?: string;
}
