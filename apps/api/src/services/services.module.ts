import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ServicesController } from './services.controller';
import { ServiceEntity, ServiceSchema } from './service.schema';
import { ServicesService } from './services.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: ServiceEntity.name, schema: ServiceSchema }])],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService]
})
export class ServicesModule {}
