import { Controller, Get, UseGuards } from '@nestjs/common';

import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('admin')
export class AdminController {
  @Get('overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  overview() {
    return {
      region: 'EU-DE',
      timezone: 'Europe/Berlin',
      message: 'Admin overview endpoint'
    };
  }
}
