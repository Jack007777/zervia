import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';

import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

import { CreateAdDto, UpdateAdStatusDto } from './dto/ad.dto';
import { AdsService } from './ads.service';

@ApiTags('Ads')
@Controller('ads')
export class AdsController {
  constructor(private readonly adsService: AdsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('bearer')
  @Roles('business', 'admin')
  @ApiBody({ type: CreateAdDto })
  create(@Req() req: { user: { sub: string } }, @Body() body: CreateAdDto) {
    return this.adsService.create(req.user.sub, body);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('bearer')
  @Roles('business', 'admin')
  listMine(@Req() req: { user: { sub: string } }) {
    return this.adsService.listMine(req.user.sub);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('bearer')
  @Roles('business', 'admin')
  @ApiBody({ type: UpdateAdStatusDto })
  updateOwnStatus(@Req() req: { user: { sub: string } }, @Param('id') id: string, @Body() body: UpdateAdStatusDto) {
    return this.adsService.updateStatusForOwner(req.user.sub, id, body.status as 'pending' | 'paused' | 'active');
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('bearer')
  @Roles('business', 'admin')
  removeOwn(@Req() req: { user: { sub: string } }, @Param('id') id: string) {
    return this.adsService.deleteForOwner(req.user.sub, id);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('bearer')
  @Roles('admin')
  listForAdmin() {
    return this.adsService.listForAdmin();
  }

  @Patch('admin/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('bearer')
  @Roles('admin')
  @ApiBody({ type: UpdateAdStatusDto })
  updateStatus(@Param('id') id: string, @Body() body: UpdateAdStatusDto) {
    return this.adsService.updateStatus(id, body.status);
  }
}
