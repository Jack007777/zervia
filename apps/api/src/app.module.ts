import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthModule } from './auth/auth.module';
import { AdsModule } from './ads/ads.module';
import { AdminModule } from './admin/admin.module';
import { AvailabilityModule } from './availability/availability.module';
import { BookingsModule } from './bookings/bookings.module';
import { BusinessesModule } from './businesses/businesses.module';
import { AppController } from './health.controller';
import { NotificationsModule } from './notifications/notifications.module';
import { ServicesModule } from './services/services.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URI') ?? config.getOrThrow<string>('MONGODB_URI')
      })
    }),
    UsersModule,
    AuthModule,
    AdsModule,
    AdminModule,
    ServicesModule,
    AvailabilityModule,
    BusinessesModule,
    BookingsModule,
    NotificationsModule
  ],
  controllers: [AppController]
})
export class AppModule {}
