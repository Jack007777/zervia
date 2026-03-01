import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { BusinessesController } from './businesses.controller';
import { BusinessEntity, BusinessSchema } from './business.schema';
import { BusinessesService } from './businesses.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: BusinessEntity.name, schema: BusinessSchema }])],
  controllers: [BusinessesController],
  providers: [BusinessesService],
  exports: [BusinessesService]
})
export class BusinessesModule {}
