import { ForbiddenException, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { TIMEZONE } from '@zervia/shared';

import { AdEntity, type AdDocument } from '../ads/ad.schema';
import { AvailabilityEntity, type AvailabilityDocument } from '../availability/availability.schema';
import { BookingEntity, type BookingDocument } from '../bookings/booking.schema';
import { ServiceEntity, type ServiceDocument } from '../services/service.schema';
import { BusinessEntity, type BusinessDocument } from './business.schema';
import { BusinessCustomerListEntity, type BusinessCustomerListDocument } from './customer-list.schema';
import type {
  CreateBusinessDto,
  SearchQueryDto,
  UpdateBusinessDto,
  UpsertBusinessCustomerListDto
} from './dto/create-business.dto';

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

@Injectable()
export class BusinessesService implements OnModuleInit, OnModuleDestroy {
  private cleanupTimer?: NodeJS.Timeout;

  constructor(
    @InjectModel(BusinessEntity.name) private readonly businessModel: Model<BusinessDocument>,
    @InjectModel(BusinessCustomerListEntity.name)
    private readonly customerListModel: Model<BusinessCustomerListDocument>,
    @InjectModel(ServiceEntity.name) private readonly serviceModel: Model<ServiceDocument>,
    @InjectModel(BookingEntity.name) private readonly bookingModel: Model<BookingDocument>,
    @InjectModel(AvailabilityEntity.name) private readonly availabilityModel: Model<AvailabilityDocument>,
    @InjectModel(AdEntity.name) private readonly adModel: Model<AdDocument>
  ) {}

  async onModuleInit() {
    await this.cleanupExpiredArchivedBusinesses();
    this.cleanupTimer = setInterval(() => {
      void this.cleanupExpiredArchivedBusinesses();
    }, 12 * 60 * 60 * 1000);
  }

  onModuleDestroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }

  create(ownerUserId: string, input: CreateBusinessDto) {
    return this.businessModel.create({
      ...input,
      city: input.location.addressLine,
      addressLine: input.location.addressLine,
      ownerUserId,
      lat: input.location.lat,
      lng: input.location.lng,
      timezone: TIMEZONE
    });
  }

  listMine(ownerUserId: string, country = 'DE') {
    return this.businessModel
      .find({ ownerUserId, country, isActive: true })
      .sort({ createdAt: -1 })
      .select(
        'name description galleryImages category country city addressLine rating priceMin priceMax bookingMode requireVerifiedPhoneForBooking isActive isVirtual virtualSeedBatch ownerUserId createdAt'
      )
      .lean()
      .exec();
  }

  getById(id: string, country: 'DE' = 'DE') {
    return this.businessModel.findOne({ _id: id, country }).exec();
  }

  update(id: string, input: UpdateBusinessDto) {
    return this.businessModel.findByIdAndUpdate(id, input, { new: true }).exec();
  }

  async ensureCanManageBusiness(businessId: string, ownerUserId: string, isAdmin = false) {
    await this.assertOwnerOrAdmin(businessId, ownerUserId, isAdmin);
  }

  async archive(businessId: string, ownerUserId: string, isAdmin = false) {
    await this.assertOwnerOrAdmin(businessId, ownerUserId, isAdmin);
    const bookingCount = await this.bookingModel.countDocuments({ businessId }).exec();

    if (bookingCount > 0) {
      const archivedAt = new Date();
      const deletionScheduledAt = new Date(archivedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
      await this.businessModel
        .findByIdAndUpdate(
          businessId,
          {
            isActive: false,
            archivedAt,
            deletionScheduledAt
          },
          { new: true }
        )
        .exec();

      return {
        success: true,
        mode: 'archived' as const,
        deletionScheduledAt
      };
    }

    await this.deleteBusinessData(businessId);
    return {
      success: true,
      mode: 'deleted' as const
    };
  }

  async listCustomerList(
    businessId: string,
    ownerUserId: string,
    isAdmin = false,
    country = 'DE'
  ) {
    await this.assertOwnerOrAdmin(businessId, ownerUserId, isAdmin);
    return this.customerListModel
      .find({ businessId, country })
      .sort({ updatedAt: -1 })
      .lean()
      .exec();
  }

  async upsertCustomerListEntry(
    businessId: string,
    ownerUserId: string,
    input: UpsertBusinessCustomerListDto,
    isAdmin = false
  ) {
    await this.assertOwnerOrAdmin(businessId, ownerUserId, isAdmin);
    const phone = input.phone.trim();
    return this.customerListModel
      .findOneAndUpdate(
        { businessId, phone },
        {
          phone,
          country: input.country ?? 'DE',
          listType: input.listType ?? 'none',
          customName: input.customName?.trim() || undefined,
          note: input.note?.trim() || undefined
        },
        { upsert: true, new: true }
      )
      .lean()
      .exec();
  }

  async deleteCustomerListEntry(
    businessId: string,
    ownerUserId: string,
    phone: string,
    isAdmin = false,
    country = 'DE'
  ) {
    await this.assertOwnerOrAdmin(businessId, ownerUserId, isAdmin);
    const normalizedPhone = phone.trim();
    await this.customerListModel.deleteOne({ businessId, phone: normalizedPhone, country }).exec();
    return { success: true };
  }

  async evaluateCustomerPhonePolicy(businessId: string, phone: string, country = 'DE') {
    const normalizedPhone = phone.trim();
    const [entry, whitelistCount] = await Promise.all([
      this.customerListModel
        .findOne({ businessId, phone: normalizedPhone, country })
        .lean()
        .exec(),
      this.customerListModel.countDocuments({ businessId, country, listType: 'whitelist' }).exec()
    ]);

    if (entry?.listType === 'blacklist') {
      return {
        allowed: false,
        reason: 'PHONE_BLACKLISTED'
      } as const;
    }

    if (whitelistCount > 0 && entry?.listType !== 'whitelist') {
      return {
        allowed: false,
        reason: 'PHONE_NOT_WHITELISTED'
      } as const;
    }

    return {
      allowed: true
    } as const;
  }

  search(query: SearchQueryDto) {
    const mongoQuery: Record<string, unknown> = {
      country: query.country ?? 'DE'
    };
    if (query.category) {
      mongoQuery.category = query.category;
    }
    if (query.city) {
      mongoQuery.city = { $regex: query.city, $options: 'i' };
    }
    const zipQuery = query.zip ?? query.postalCode;
    if (zipQuery) {
      mongoQuery.addressLine = { $regex: zipQuery, $options: 'i' };
    }
    if (query.priceMin || query.priceMax) {
      mongoQuery.priceMin = {
        ...(query.priceMin !== undefined ? { $gte: query.priceMin } : {}),
        ...(query.priceMax !== undefined ? { $lte: query.priceMax } : {})
      };
    }
    if (query.q) {
      mongoQuery.$or = [
        { name: { $regex: query.q, $options: 'i' } },
        { description: { $regex: query.q, $options: 'i' } }
      ];
    }
    if (query.ratingMin !== undefined) {
      mongoQuery.rating = { $gte: query.ratingMin };
    }
    mongoQuery.isActive = true;

    return this.businessModel
      .find(mongoQuery)
      .limit(500)
      .lean()
      .exec()
      .then((results) => {
        if (
          query.lat === undefined ||
          query.lng === undefined
        ) {
          return results;
        }

        const withDistance = results
          .filter((item) => typeof item.lat === 'number' && typeof item.lng === 'number')
          .map((item) => {
            const dist = distanceKm(query.lat as number, query.lng as number, item.lat as number, item.lng as number);
            return {
              ...item,
              distanceKm: Number(dist.toFixed(2))
            };
          });

        const radiusLimit = query.radiusKm ?? Number.POSITIVE_INFINITY;
        return withDistance
          .filter((item) => item.distanceKm <= radiusLimit)
          .sort((a, b) => a.distanceKm - b.distanceKm);
      });
  }

  listForAdmin(limit = 100) {
    return this.businessModel
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('name description galleryImages category country city addressLine rating priceMin priceMax bookingMode requireVerifiedPhoneForBooking isActive isVirtual virtualSeedBatch ownerUserId createdAt')
      .lean()
      .exec();
  }

  updateForAdmin(
    businessId: string,
    input: {
      name?: string;
      category?: string;
      city?: string;
      addressLine?: string;
      bookingMode?: 'instant' | 'request';
      requireVerifiedPhoneForBooking?: boolean;
      isActive?: boolean;
    }
  ) {
    return this.businessModel
      .findByIdAndUpdate(
        businessId,
        {
          ...(input.name ? { name: input.name } : {}),
          ...(input.category ? { category: input.category } : {}),
          ...(input.city ? { city: input.city } : {}),
          ...(input.addressLine ? { addressLine: input.addressLine } : {}),
          ...(input.bookingMode ? { bookingMode: input.bookingMode } : {}),
          ...(typeof input.requireVerifiedPhoneForBooking === 'boolean'
            ? { requireVerifiedPhoneForBooking: input.requireVerifiedPhoneForBooking }
            : {}),
          ...(typeof input.isActive === 'boolean' ? { isActive: input.isActive } : {})
        },
        { new: true }
      )
      .select('name description galleryImages category country city addressLine rating priceMin priceMax bookingMode requireVerifiedPhoneForBooking isActive isVirtual virtualSeedBatch ownerUserId createdAt')
      .lean()
      .exec();
  }

  private async cleanupExpiredArchivedBusinesses() {
    const expiredBusinesses = await this.businessModel
      .find({
        isActive: false,
        deletionScheduledAt: { $lte: new Date() }
      })
      .select('_id')
      .lean()
      .exec();

    if (expiredBusinesses.length === 0) {
      return;
    }

    await Promise.all(expiredBusinesses.map((business) => this.deleteBusinessData(String(business._id))));
  }

  private async deleteBusinessData(businessId: string) {
    await Promise.all([
      this.bookingModel.deleteMany({ businessId }).exec(),
      this.serviceModel.deleteMany({ businessId }).exec(),
      this.availabilityModel.deleteMany({ businessId }).exec(),
      this.customerListModel.deleteMany({ businessId }).exec(),
      this.adModel.deleteMany({ businessId }).exec()
    ]);
    await this.businessModel.findByIdAndDelete(businessId).exec();
  }

  private async assertOwnerOrAdmin(businessId: string, ownerUserId: string, isAdmin: boolean) {
    if (isAdmin) {
      return;
    }
    const business = await this.businessModel
      .findOne({ _id: businessId, ownerUserId })
      .select('_id')
      .lean()
      .exec();
    if (!business) {
      throw new ForbiddenException({
        errorCode: 'BUSINESS_NOT_OWNED',
        message: 'You can only manage your own branches'
      });
    }
  }
}
