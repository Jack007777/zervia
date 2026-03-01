import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AdEntity, AdSchema } from './ad.schema';
import { AdsController } from './ads.controller';
import { AdsService } from './ads.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: AdEntity.name, schema: AdSchema }])],
  controllers: [AdsController],
  providers: [AdsService],
  exports: [AdsService]
})
export class AdsModule {}

