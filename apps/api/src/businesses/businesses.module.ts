import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { BusinessesController } from './businesses.controller';
import { BusinessEntity, BusinessSchema } from './business.schema';
import { BusinessCustomerListEntity, BusinessCustomerListSchema } from './customer-list.schema';
import { BusinessesService } from './businesses.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BusinessEntity.name, schema: BusinessSchema },
      { name: BusinessCustomerListEntity.name, schema: BusinessCustomerListSchema }
    ])
  ],
  controllers: [BusinessesController],
  providers: [BusinessesService],
  exports: [BusinessesService]
})
export class BusinessesModule {}
