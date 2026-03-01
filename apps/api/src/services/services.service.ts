import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';
import { ServiceEntity, type ServiceDocument } from './service.schema';

@Injectable()
export class ServicesService {
  constructor(@InjectModel(ServiceEntity.name) private readonly serviceModel: Model<ServiceDocument>) {}

  create(businessId: string, dto: CreateServiceDto) {
    return this.serviceModel.create({
      businessId,
      ...dto
    });
  }

  listByBusiness(businessId: string, country: 'DE' = 'DE') {
    return this.serviceModel.find({ businessId, country }).sort({ createdAt: -1 }).exec();
  }

  update(serviceId: string, dto: UpdateServiceDto) {
    return this.serviceModel.findByIdAndUpdate(serviceId, dto, { new: true }).exec();
  }

  async getById(serviceId: string) {
    const service = await this.serviceModel.findById(serviceId).exec();
    if (!service) {
      throw new NotFoundException({
        errorCode: 'SERVICE_NOT_FOUND',
        message: 'Service not found'
      });
    }
    return service;
  }

  remove(serviceId: string) {
    return this.serviceModel.findByIdAndDelete(serviceId).exec();
  }
}
