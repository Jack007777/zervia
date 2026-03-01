import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { AdEntity, type AdDocument } from './ad.schema';
import { CreateAdDto } from './dto/ad.dto';

@Injectable()
export class AdsService {
  constructor(@InjectModel(AdEntity.name) private readonly adModel: Model<AdDocument>) {}

  create(userId: string, dto: CreateAdDto) {
    return this.adModel.create({
      businessId: dto.businessId,
      createdByUserId: userId,
      title: dto.title,
      description: dto.description,
      landingUrl: dto.landingUrl,
      imageUrl: dto.imageUrl,
      country: dto.country ?? 'DE',
      currency: dto.currency ?? 'EUR',
      budgetDaily: dto.budgetDaily ?? 20,
      status: 'pending'
    });
  }

  listMine(userId: string) {
    return this.adModel.find({ createdByUserId: userId }).sort({ createdAt: -1 }).lean().exec();
  }

  listForAdmin(limit = 100) {
    return this.adModel.find().sort({ createdAt: -1 }).limit(limit).lean().exec();
  }

  async updateStatus(adId: string, status: 'pending' | 'approved' | 'rejected' | 'paused' | 'active') {
    const updated = await this.adModel.findByIdAndUpdate(adId, { status }, { new: true }).lean().exec();
    if (!updated) {
      throw new NotFoundException({
        errorCode: 'AD_NOT_FOUND',
        message: 'Ad record not found'
      });
    }
    return updated;
  }

  async countPending() {
    return this.adModel.countDocuments({ status: 'pending' }).exec();
  }
}

