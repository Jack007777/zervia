import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { TIMEZONE } from '@zervia/shared';

import { BusinessEntity, type BusinessDocument } from './business.schema';
import type { CreateBusinessDto, SearchQueryDto, UpdateBusinessDto } from './dto/create-business.dto';

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
      .select('name category country city addressLine rating priceMin priceMax isActive isVirtual virtualSeedBatch ownerUserId createdAt')
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
      .select('name category country city addressLine rating priceMin priceMax isActive isVirtual virtualSeedBatch ownerUserId createdAt')
      .lean()
      .exec();
  }
}
