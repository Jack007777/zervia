import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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

  async updateStatusForOwner(
    userId: string,
    adId: string,
    status: 'pending' | 'paused' | 'active'
  ) {
    if (!['pending', 'paused', 'active'].includes(status)) {
      throw new BadRequestException({
        errorCode: 'INVALID_AD_STATUS',
        message: 'Business users can only set ads to pending, active or paused'
      });
    }

    const existing = await this.adModel.findById(adId).lean().exec();
    if (!existing) {
      throw new NotFoundException({
        errorCode: 'AD_NOT_FOUND',
        message: 'Ad record not found'
      });
    }
    if (existing.createdByUserId !== userId) {
      throw new ForbiddenException({
        errorCode: 'AD_FORBIDDEN',
        message: 'You can only manage your own ads'
      });
    }

    return this.updateStatus(adId, status);
  }

  async deleteForOwner(userId: string, adId: string) {
    const existing = await this.adModel.findById(adId).lean().exec();
    if (!existing) {
      throw new NotFoundException({
        errorCode: 'AD_NOT_FOUND',
        message: 'Ad record not found'
      });
    }
    if (existing.createdByUserId !== userId) {
      throw new ForbiddenException({
        errorCode: 'AD_FORBIDDEN',
        message: 'You can only delete your own ads'
      });
    }

    await this.adModel.findByIdAndDelete(adId).exec();

    return {
      success: true,
      adId
    };
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
