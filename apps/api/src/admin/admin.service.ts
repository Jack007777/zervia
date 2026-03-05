import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BookingEntity, type BookingDocument } from '../bookings/booking.schema';
import { BusinessEntity, type BusinessDocument } from '../businesses/business.schema';
import { UsersService } from '../users/users.service';
import { AdsService } from '../ads/ads.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly usersService: UsersService,
    private readonly adsService: AdsService,
    @InjectModel(BusinessEntity.name) private readonly businessModel: Model<BusinessDocument>,
    @InjectModel(BookingEntity.name) private readonly bookingModel: Model<BookingDocument>
  ) {}

  async overview() {
    const [users, businesses, bookings, pendingAds] = await Promise.all([
      this.usersService.listForAdmin(1_000).then((rows) => rows.length),
      this.businessModel.countDocuments().exec(),
      this.bookingModel.countDocuments().exec(),
      this.adsService.countPending()
    ]);

    return {
      region: 'EU-DE',
      timezone: 'Europe/Berlin',
      stats: {
        users,
        businesses,
        bookings,
        pendingAds
      }
    };
  }

  listUsers() {
    return this.usersService.listForAdmin();
  }

  updateUser(
    userId: string,
    input: {
      roles?: ('customer' | 'business' | 'admin')[];
      isActive?: boolean;
      phoneVerified?: boolean;
      manualPhoneApprovalPending?: boolean;
    }
  ) {
    return this.usersService.updateAdminUser(userId, input);
  }
}
