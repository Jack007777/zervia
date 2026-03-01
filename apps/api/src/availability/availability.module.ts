import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { BookingEntity, BookingSchema } from '../bookings/booking.schema';
import { ServiceEntity, ServiceSchema } from '../services/service.schema';
import { AvailabilityController } from './availability.controller';
import { AvailabilityEntity, AvailabilitySchema } from './availability.schema';
import { AvailabilityService } from './availability.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AvailabilityEntity.name, schema: AvailabilitySchema },
      { name: ServiceEntity.name, schema: ServiceSchema },
      { name: BookingEntity.name, schema: BookingSchema }
    ])
  ],
  controllers: [AvailabilityController],
  providers: [AvailabilityService],
  exports: [AvailabilityService]
})
export class AvailabilityModule {}
