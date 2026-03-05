import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
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

import { BusinessesService } from './businesses.service';
import { CreateBusinessDto, SearchQueryDto, UpdateBusinessDto } from './dto/create-business.dto';

@ApiTags('Business')
@Controller()
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Post('business')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('bearer')
  @Roles('business')
  @ApiBody({ type: CreateBusinessDto })
  create(@Req() req: { user: { sub: string } }, @Body() body: CreateBusinessDto) {
    return this.businessesService.create(req.user.sub, body);
  }

  @Get('businesses/me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('bearer')
  @Roles('business', 'admin')
  @ApiQuery({ name: 'country', required: false, example: 'DE' })
  myBusinesses(@Req() req: { user: { sub: string } }, @Query('country') country = 'DE') {
    return this.businessesService.listMine(req.user.sub, country);
  }

  @Get('business/:id')
  @ApiParam({ name: 'id', example: 'biz_123' })
  @ApiQuery({ name: 'country', required: false, example: 'DE' })
  getById(@Param('id') id: string, @Query('country') country = 'DE') {
    return this.businessesService.getById(id, country as 'DE');
  }

  @Patch('business/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('bearer')
  @Roles('business', 'admin')
  @ApiParam({ name: 'id', example: 'biz_123' })
  @ApiBody({ type: UpdateBusinessDto })
  update(@Param('id') id: string, @Body() body: UpdateBusinessDto) {
    return this.businessesService.update(id, body);
  }

  @Get('search')
  @ApiQuery({ name: 'country', required: false })
  @ApiQuery({ name: 'lat', required: false, type: Number })
  @ApiQuery({ name: 'lng', required: false, type: Number })
  @ApiQuery({ name: 'radiusKm', required: false, type: Number })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'zip', required: false })
  @ApiQuery({ name: 'postalCode', required: false })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'priceMin', required: false, type: Number })
  @ApiQuery({ name: 'priceMax', required: false, type: Number })
  @ApiQuery({ name: 'ratingMin', required: false, type: Number })
  @ApiOkResponse({ description: 'Search businesses' })
  search(@Query() query: SearchQueryDto) {
    return this.businessesService.search(query);
  }
}
