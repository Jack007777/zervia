import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
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
import { CreateServiceDto, ListServicesQueryDto, UpdateServiceDto } from './dto/service.dto';
import { ServicesService } from './services.service';

@ApiTags('Service')
@Controller()
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post('business/:id/services')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('bearer')
  @Roles('business', 'admin')
  @ApiParam({ name: 'id', example: 'biz_123' })
  @ApiBody({ type: CreateServiceDto })
  create(@Param('id') businessId: string, @Body() body: CreateServiceDto) {
    return this.servicesService.create(businessId, body);
  }

  @Get('business/:id/services')
  @ApiParam({ name: 'id', example: 'biz_123' })
  @ApiQuery({ name: 'country', required: false, example: 'DE' })
  @ApiOkResponse({ description: 'List services under business' })
  list(@Param('id') businessId: string, @Query() query: ListServicesQueryDto) {
    return this.servicesService.listByBusiness(businessId, query.country);
  }

  @Patch('services/:serviceId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('bearer')
  @Roles('business', 'admin')
  @ApiParam({ name: 'serviceId', example: 'svc_123' })
  @ApiBody({ type: UpdateServiceDto })
  update(@Param('serviceId') serviceId: string, @Body() body: UpdateServiceDto) {
    return this.servicesService.update(serviceId, body);
  }

  @Delete('services/:serviceId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('bearer')
  @Roles('business', 'admin')
  @ApiParam({ name: 'serviceId', example: 'svc_123' })
  remove(@Param('serviceId') serviceId: string) {
    return this.servicesService.remove(serviceId);
  }
}
