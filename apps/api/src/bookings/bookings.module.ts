import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AvailabilityEntity, AvailabilitySchema } from '../availability/availability.schema';
import { ServiceEntity, ServiceSchema } from '../services/service.schema';
import { BookingEntity, BookingSchema } from './booking.schema';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BookingEntity.name, schema: BookingSchema },
      { name: ServiceEntity.name, schema: ServiceSchema },
      { name: AvailabilityEntity.name, schema: AvailabilitySchema }
    ])
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService]
})
export class BookingsModule {}
