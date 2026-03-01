import { Body, Controller, Get, Param, Put, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiTags
} from '@nestjs/swagger';

import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PutAvailabilityDto, SlotsQueryDto } from './dto/availability.dto';
import { AvailabilityService } from './availability.service';

@ApiTags('Availability')
@Controller()
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Put('business/:id/availability')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('bearer')
  @Roles('business', 'admin')
  @ApiParam({ name: 'id', example: 'biz_123' })
  @ApiBody({ type: PutAvailabilityDto })
  putAvailability(@Param('id') businessId: string, @Body() body: PutAvailabilityDto) {
    return this.availabilityService.upsert(businessId, body);
  }

  @Get('business/:id/availability')
  @ApiParam({ name: 'id', example: 'biz_123' })
  getAvailability(@Param('id') businessId: string) {
    return this.availabilityService.get(businessId);
  }

  @Get('business/:id/slots')
  @ApiParam({ name: 'id', example: 'biz_123' })
  @ApiQuery({ name: 'serviceId', required: true })
  @ApiQuery({ name: 'date', required: true, example: '2026-03-20' })
  @ApiQuery({ name: 'staffId', required: false })
  @ApiOkResponse({ description: 'Available slots' })
  slots(@Param('id') businessId: string, @Query() query: SlotsQueryDto) {
    return this.availabilityService.getSlots(businessId, query);
  }
}
