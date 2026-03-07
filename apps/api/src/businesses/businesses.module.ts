import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AdEntity, AdSchema } from '../ads/ad.schema';
import { AvailabilityEntity, AvailabilitySchema } from '../availability/availability.schema';
import { BookingEntity, BookingSchema } from '../bookings/booking.schema';
import { ServiceEntity, ServiceSchema } from '../services/service.schema';
import { BusinessesController } from './businesses.controller';
import { BusinessEntity, BusinessSchema } from './business.schema';
import { BusinessCustomerListEntity, BusinessCustomerListSchema } from './customer-list.schema';
import { BusinessesService } from './businesses.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BusinessEntity.name, schema: BusinessSchema },
      { name: BusinessCustomerListEntity.name, schema: BusinessCustomerListSchema },
      { name: ServiceEntity.name, schema: ServiceSchema },
      { name: BookingEntity.name, schema: BookingSchema },
      { name: AvailabilityEntity.name, schema: AvailabilitySchema },
      { name: AdEntity.name, schema: AdSchema }
    ])
  ],
  controllers: [BusinessesController],
  providers: [BusinessesService],
  exports: [BusinessesService]
})
export class BusinessesModule {}
