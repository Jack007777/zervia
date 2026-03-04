import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DateTime, Interval } from 'luxon';
import { Model } from 'mongoose';

import { BookingEntity, type BookingDocument } from '../bookings/booking.schema';
import { ServiceEntity, type ServiceDocument } from '../services/service.schema';
import { AvailabilityEntity, type AvailabilityDocument } from './availability.schema';
import { PutAvailabilityDto, SlotsQueryDto } from './dto/availability.dto';

type AvailabilityWindow = { start: string; end: string };
type AvailabilityDocLike = {
  timezone?: string;
  weeklySchedule?: Array<{ dayOfWeek: number; staffId?: string; windows: AvailabilityWindow[] }>;
  specialDateOverrides?: Array<{
    date: string;
    staffId?: string;
    isClosed?: boolean;
    windows: AvailabilityWindow[];
  }>;
} | null;

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectModel(AvailabilityEntity.name) private readonly availabilityModel: Model<AvailabilityDocument>,
    @InjectModel(ServiceEntity.name) private readonly serviceModel: Model<ServiceDocument>,
    @InjectModel(BookingEntity.name) private readonly bookingModel: Model<BookingDocument>
  ) {}

  async upsert(businessId: string, dto: PutAvailabilityDto) {
    return this.availabilityModel
      .findOneAndUpdate(
        { businessId },
        {
          businessId,
          timezone: dto.timezone ?? 'Europe/Berlin',
          weeklySchedule: dto.weeklySchedule,
          specialDateOverrides: dto.specialDateOverrides ?? []
        },
        { new: true, upsert: true }
      )
      .lean()
      .exec();
  }

  async get(businessId: string) {
    const availability = await this.availabilityModel.findOne({ businessId }).lean().exec();
    return (
      availability ?? {
        businessId,
        timezone: 'Europe/Berlin',
        weeklySchedule: [],
        specialDateOverrides: []
      }
    );
  }

  async getSlots(businessId: string, query: SlotsQueryDto) {
    const [availability, service] = await Promise.all([
      this.availabilityModel.findOne({ businessId }).lean().exec(),
      this.serviceModel.findOne({ _id: query.serviceId, businessId }).lean().exec()
    ]);

    if (!service) {
      throw new NotFoundException({
        errorCode: 'SERVICE_NOT_FOUND',
        message: 'Service not found for this business'
      });
    }

    const timezone = availability?.timezone ?? 'Europe/Berlin';
    const dayStart = DateTime.fromISO(query.date, { zone: timezone }).startOf('day');
    const dayEnd = dayStart.plus({ days: 1 });
    const durationMinutes = service.durationMinutes;
    const now = DateTime.now().setZone(timezone);

    if (dayEnd <= now) {
      return query.staffId ? [] : {};
    }

    const overlappingBookings = await this.bookingModel
      .find({
        businessId,
        status: { $in: ['pending', 'confirmed'] },
        startTime: { $lt: dayEnd.toJSDate() },
        endTime: { $gt: dayStart.toJSDate() },
        ...(query.staffId ? { staffId: query.staffId } : {})
      })
      .select({ startTime: 1, endTime: 1, staffId: 1 })
      .lean()
      .exec();

    const targetStaffIds = this.resolveTargetStaffIds(availability, query.staffId);
    const slotsByStaff: Record<string, string[]> = {};

    for (const staffId of targetStaffIds) {
      const windows = this.resolveWindowsForDate(availability, query.date, dayStart.weekday, staffId);
      const bookingIntervals = overlappingBookings
        .filter((booking) => {
          if (query.staffId) {
            return true;
          }
          return (booking.staffId ?? 'default') === staffId;
        })
        .map((booking) =>
          Interval.fromDateTimes(
            DateTime.fromJSDate(booking.startTime as Date, { zone: timezone }),
            DateTime.fromJSDate(booking.endTime as Date, { zone: timezone })
          )
        );

      slotsByStaff[staffId] = this.generateSlots(
        windows,
        dayStart,
        durationMinutes,
        bookingIntervals,
        now
      );
    }

    if (query.staffId) {
      return slotsByStaff[query.staffId] ?? [];
    }

    return slotsByStaff;
  }

  private resolveTargetStaffIds(availability: AvailabilityDocLike, requestedStaffId?: string): string[] {
    if (requestedStaffId) {
      return [requestedStaffId];
    }

    const ids = new Set<string>();
    for (const rule of availability?.weeklySchedule ?? []) {
      if (rule.staffId) {
        ids.add(rule.staffId);
      }
    }
    for (const override of availability?.specialDateOverrides ?? []) {
      if (override.staffId) {
        ids.add(override.staffId);
      }
    }

    return ids.size > 0 ? [...ids] : ['default'];
  }

  private resolveWindowsForDate(
    availability: AvailabilityDocLike,
    date: string,
    dayOfWeek: number,
    staffId: string
  ): AvailabilityWindow[] {
    const overrides = availability?.specialDateOverrides ?? [];
    const specificOverride = overrides.find((o) => o.date === date && o.staffId === staffId);
    const globalOverride = overrides.find((o) => o.date === date && !o.staffId);

    if (specificOverride) {
      return specificOverride.isClosed ? [] : specificOverride.windows;
    }
    if (globalOverride) {
      return globalOverride.isClosed ? [] : globalOverride.windows;
    }

    const weekly = availability?.weeklySchedule ?? [];
    const staffWindows = weekly
      .filter((entry) => entry.dayOfWeek === dayOfWeek && (entry.staffId ?? 'default') === staffId)
      .flatMap((entry) => entry.windows);

    if (staffWindows.length > 0) {
      return staffWindows;
    }

    if (staffId !== 'default') {
      return weekly
        .filter((entry) => entry.dayOfWeek === dayOfWeek && !entry.staffId)
        .flatMap((entry) => entry.windows);
    }

    return [];
  }

  private generateSlots(
    windows: AvailabilityWindow[],
    dayStart: DateTime,
    durationMinutes: number,
    bookingIntervals: Interval[],
    now: DateTime
  ): string[] {
    const slots: string[] = [];

    for (const window of windows) {
      const start = this.toDateTime(dayStart, window.start);
      const end = this.toDateTime(dayStart, window.end);

      if (!start.isValid || !end.isValid || end <= start) {
        continue;
      }

      let cursor = start;
      while (cursor.plus({ minutes: durationMinutes }) <= end) {
        const slotEnd = cursor.plus({ minutes: durationMinutes });
        const slotInterval = Interval.fromDateTimes(cursor, slotEnd);
        const hasConflict = bookingIntervals.some((bookingInterval) =>
          bookingInterval.overlaps(slotInterval)
        );
        if (!hasConflict && cursor >= now) {
          slots.push(cursor.toISO({ suppressMilliseconds: true }) ?? '');
        }
        cursor = cursor.plus({ minutes: 15 });
      }
    }

    return slots.filter(Boolean);
  }

  private toDateTime(dayStart: DateTime, hhmm: string): DateTime {
    const [hoursRaw, minutesRaw] = hhmm.split(':');
    const hours = Number(hoursRaw);
    const minutes = Number(minutesRaw);
    return dayStart.set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });
  }
}
