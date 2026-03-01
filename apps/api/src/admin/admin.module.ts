import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AdsModule } from '../ads/ads.module';
import { BookingEntity, BookingSchema } from '../bookings/booking.schema';
import { BusinessEntity, BusinessSchema } from '../businesses/business.schema';
import { UsersModule } from '../users/users.module';

import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    UsersModule,
    AdsModule,
    MongooseModule.forFeature([
      { name: BusinessEntity.name, schema: BusinessSchema },
      { name: BookingEntity.name, schema: BookingSchema }
    ])
  ],
  controllers: [AdminController],
  providers: [AdminService]
})
export class AdminModule {}
