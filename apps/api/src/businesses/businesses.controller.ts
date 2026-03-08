import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { randomUUID } from 'node:crypto';

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiTags
} from '@nestjs/swagger';

import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

import { BusinessesService } from './businesses.service';
import {
  CreateBusinessDto,
  SearchQueryDto,
  UpdateBusinessDto,
  UpsertBusinessCustomerListDto
} from './dto/create-business.dto';

type UploadedBranchImageFile = {
  buffer: Buffer;
  mimetype: string;
  size: number;
  originalname?: string;
};

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

  @Post('business/:id/images')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth('bearer')
  @ApiConsumes('multipart/form-data')
  @Roles('business', 'admin')
  async uploadImage(
    @Param('id') id: string,
    @Req() req: { user: { sub: string; roles?: string[] } },
    @UploadedFile() file?: UploadedBranchImageFile
  ) {
    if (!file) {
      throw new BadRequestException({
        errorCode: 'IMAGE_REQUIRED',
        message: 'Image file is required'
      });
    }

    const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
    if (!allowedMimeTypes.has(file.mimetype)) {
      throw new BadRequestException({
        errorCode: 'IMAGE_TYPE_INVALID',
        message: 'Only JPG, PNG and WEBP images are allowed'
      });
    }

    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new BadRequestException({
        errorCode: 'IMAGE_TOO_LARGE',
        message: 'Image must be 5MB or smaller'
      });
    }

    await this.businessesService.ensureCanManageBusiness(
      id,
      req.user.sub,
      Boolean(req.user.roles?.includes('admin'))
    );

    const uploadsDir = join(process.cwd(), 'uploads', 'branches');
    await mkdir(uploadsDir, { recursive: true });

    const extension = extname(file.originalname || '').toLowerCase();
    const safeExtension =
      extension && ['.jpg', '.jpeg', '.png', '.webp'].includes(extension)
        ? extension
        : file.mimetype === 'image/png'
          ? '.png'
          : file.mimetype === 'image/webp'
            ? '.webp'
            : '.jpg';
    const fileName = `${id}-${randomUUID()}${safeExtension}`;
    const outputPath = join(uploadsDir, fileName);
    await writeFile(outputPath, file.buffer);

    const publicBaseUrl = (process.env.BASE_URL ?? `http://localhost:${process.env.PORT ?? '4000'}`)
      .replace(/\/api\/v1\/?$/, '')
      .replace(/\/$/, '');

    return {
      success: true,
      url: `${publicBaseUrl}/uploads/branches/${fileName}`
    };
  }

  @Delete('business/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('bearer')
  @Roles('business', 'admin')
  @ApiParam({ name: 'id', example: 'biz_123' })
  archive(
    @Param('id') id: string,
    @Req() req: { user: { sub: string; roles?: string[] } }
  ) {
    return this.businessesService.archive(
      id,
      req.user.sub,
      Boolean(req.user.roles?.includes('admin'))
    );
  }

  @Get('business/:id/customers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('bearer')
  @Roles('business', 'admin')
  @ApiQuery({ name: 'country', required: false, example: 'DE' })
  listCustomerList(
    @Param('id') businessId: string,
    @Req() req: { user: { sub: string; roles?: string[] } },
    @Query('country') country = 'DE'
  ) {
    return this.businessesService.listCustomerList(
      businessId,
      req.user.sub,
      Boolean(req.user.roles?.includes('admin')),
      country
    );
  }

  @Put('business/:id/customers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('bearer')
  @Roles('business', 'admin')
  @ApiBody({ type: UpsertBusinessCustomerListDto })
  upsertCustomerListEntry(
    @Param('id') businessId: string,
    @Req() req: { user: { sub: string; roles?: string[] } },
    @Body() body: UpsertBusinessCustomerListDto
  ) {
    return this.businessesService.upsertCustomerListEntry(
      businessId,
      req.user.sub,
      body,
      Boolean(req.user.roles?.includes('admin'))
    );
  }

  @Delete('business/:id/customers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('bearer')
  @Roles('business', 'admin')
  @ApiQuery({ name: 'phone', required: true, example: '+4915112345678' })
  @ApiQuery({ name: 'country', required: false, example: 'DE' })
  deleteCustomerListEntry(
    @Param('id') businessId: string,
    @Req() req: { user: { sub: string; roles?: string[] } },
    @Query('phone') phone: string,
    @Query('country') country = 'DE'
  ) {
    return this.businessesService.deleteCustomerListEntry(
      businessId,
      req.user.sub,
      phone,
      Boolean(req.user.roles?.includes('admin')),
      country
    );
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
