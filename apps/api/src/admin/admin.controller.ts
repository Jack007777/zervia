import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';

import { UpdateAdStatusDto } from '../ads/dto/ad.dto';
import { AdsService } from '../ads/ads.service';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

import { AdminService } from './admin.service';
import { UpdateAdminUserDto } from './dto/admin.dto';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly adsService: AdsService
  ) {}

  @Get('overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('bearer')
  @Roles('admin')
  overview() {
    return this.adminService.overview();
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('bearer')
  @Roles('admin')
  users() {
    return this.adminService.listUsers();
  }

  @Patch('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('bearer')
  @Roles('admin')
  @ApiBody({ type: UpdateAdminUserDto })
  updateUser(@Param('id') userId: string, @Body() body: UpdateAdminUserDto) {
    return this.adminService.updateUser(userId, body);
  }

  @Get('ads')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('bearer')
  @Roles('admin')
  ads() {
    return this.adsService.listForAdmin();
  }

  @Patch('ads/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('bearer')
  @Roles('admin')
  @ApiBody({ type: UpdateAdStatusDto })
  updateAdStatus(@Param('id') adId: string, @Body() body: UpdateAdStatusDto) {
    return this.adsService.updateStatus(adId, body.status);
  }
}

