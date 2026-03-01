import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { TIMEZONE } from '@zervia/shared';

import { BusinessEntity, type BusinessDocument } from './business.schema';
import type { CreateBusinessDto, SearchQueryDto, UpdateBusinessDto } from './dto/create-business.dto';

@Injectable()
export class BusinessesService {
  constructor(
    @InjectModel(BusinessEntity.name) private readonly businessModel: Model<BusinessDocument>
  ) {}

  create(input: CreateBusinessDto) {
    return this.businessModel.create({
      ...input,
      city: input.location.addressLine,
      addressLine: input.location.addressLine,
      ownerUserId: 'from-jwt-user',
      lat: input.location.lat,
      lng: input.location.lng,
      timezone: TIMEZONE
    });
  }

  getById(id: string, country: 'DE' = 'DE') {
    return this.businessModel.findOne({ _id: id, country }).exec();
  }

  update(id: string, input: UpdateBusinessDto) {
    return this.businessModel.findByIdAndUpdate(id, input, { new: true }).exec();
  }

  search(query: SearchQueryDto) {
    const mongoQuery: Record<string, unknown> = {
      country: query.country ?? 'DE'
    };
    if (query.category) {
      mongoQuery.category = query.category;
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

    // Lat/lng/radiusKm are accepted by API contract and can later map to geospatial index query.
    return this.businessModel.find(mongoQuery).limit(50).exec();
  }

  listForAdmin(limit = 100) {
    return this.businessModel
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('name category country city addressLine rating priceMin priceMax isActive ownerUserId createdAt')
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
          ...(typeof input.isActive === 'boolean' ? { isActive: input.isActive } : {})
        },
        { new: true }
      )
      .select('name category country city addressLine rating priceMin priceMax isActive ownerUserId createdAt')
      .lean()
      .exec();
  }
}
