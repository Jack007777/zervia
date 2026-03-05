import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AvailabilityEntity, AvailabilitySchema } from '../availability/availability.schema';
import { BusinessEntity, BusinessSchema } from '../businesses/business.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { ServiceEntity, ServiceSchema } from '../services/service.schema';
import { UserEntity, UserSchema } from '../users/user.schema';
import { BookingEntity, BookingSchema } from './booking.schema';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BookingEntity.name, schema: BookingSchema },
      { name: BusinessEntity.name, schema: BusinessSchema },
      { name: ServiceEntity.name, schema: ServiceSchema },
      { name: AvailabilityEntity.name, schema: AvailabilitySchema },
      { name: UserEntity.name, schema: UserSchema }
    ]),
    NotificationsModule
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService]
})
export class BookingsModule {}
