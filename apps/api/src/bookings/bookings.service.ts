import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { DateTime, Interval } from 'luxon';
import { Connection, Model } from 'mongoose';

import { AvailabilityEntity, type AvailabilityDocument } from '../availability/availability.schema';
import { BusinessEntity, type BusinessDocument } from '../businesses/business.schema';
import { SmsService } from '../notifications/sms.service';
import { ServiceEntity, type ServiceDocument } from '../services/service.schema';
import { UserEntity, type UserDocument } from '../users/user.schema';
import { BookingEntity, type BookingDocument } from './booking.schema';
import type {
  AcceptCounterProposalDto,
  CancelBookingDto,
  ConfirmBookingDto,
  CounterProposalDto,
  CreateBookingDto,
  RejectBookingDto
} from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(BookingEntity.name) private readonly bookingModel: Model<BookingDocument>,
    @InjectModel(BusinessEntity.name) private readonly businessModel: Model<BusinessDocument>,
    @InjectModel(ServiceEntity.name) private readonly serviceModel: Model<ServiceDocument>,
    @InjectModel(AvailabilityEntity.name) private readonly availabilityModel: Model<AvailabilityDocument>,
    @InjectModel(UserEntity.name) private readonly userModel: Model<UserDocument>,
    private readonly smsService: SmsService
  ) {}

  async createBooking(customerUserId: string | undefined, input: CreateBookingDto) {
    const isGuest = !customerUserId;
    if (isGuest && !input.guestPhone) {
      throw new BadRequestException({
        errorCode: 'GUEST_PHONE_REQUIRED',
        message: 'guestPhone is required for guest bookings'
      });
    }

    const session = await this.connection.startSession();
    try {
      let createdBooking: BookingDocument | null = null;
      await session.withTransaction(async () => {
        const [service, availability, business] = await Promise.all([
          this.serviceModel
            .findOne({ _id: input.serviceId, businessId: input.businessId })
            .session(session)
            .exec(),
          this.availabilityModel.findOne({ businessId: input.businessId }).session(session).exec()
          ,
          this.businessModel.findById(input.businessId).session(session).exec()
        ]);

        if (!service) {
          throw new NotFoundException({
            errorCode: 'SERVICE_NOT_FOUND',
            message: 'Service not found for business'
          });
        }
        if (!business) {
          throw new NotFoundException({
            errorCode: 'BUSINESS_NOT_FOUND',
            message: 'Business not found'
          });
        }

        if (business.requireVerifiedPhoneForBooking) {
          if (!customerUserId) {
            throw new BadRequestException({
              errorCode: 'PHONE_VERIFICATION_REQUIRED',
              message: 'Phone-verified account is required for this business'
            });
          }
          const customer = await this.userModel.findById(customerUserId).session(session).exec();
          if (!customer?.phoneVerified) {
            throw new BadRequestException({
              errorCode: 'PHONE_VERIFICATION_REQUIRED',
              message: 'Please verify your phone number before booking this business'
            });
          }
        }

        const timezone = availability?.timezone ?? 'Europe/Berlin';
        const start = DateTime.fromISO(input.startTime, { setZone: true }).setZone(timezone);
        const bookingMode = business.bookingMode ?? 'instant';
        if (
          !start.isValid ||
          (bookingMode === 'instant' && (start.second !== 0 || start.millisecond !== 0 || start.minute % 15 !== 0))
        ) {
          throw new ConflictException({
            errorCode: 'BOOKING_CONFLICT',
            message:
              bookingMode === 'instant'
                ? 'startTime must match 15-minute slot boundaries'
                : 'startTime is invalid'
          });
        }

        const end = start.plus({ minutes: service.durationMinutes });
        const resolvedStaffId = input.staffId ?? service.staffId ?? 'default';

        if (bookingMode === 'instant') {
          const windows = this.resolveWindowsForDate(
            availability,
            start.toFormat('yyyy-LL-dd'),
            start.weekday,
            resolvedStaffId
          );
          const withinWindow = windows.some((window) => {
            const windowStart = this.toDateTime(start.startOf('day'), window.start);
            const windowEnd = this.toDateTime(start.startOf('day'), window.end);
            if (!windowStart.isValid || !windowEnd.isValid) {
              return false;
            }
            const appointment = Interval.fromDateTimes(start, end);
            const allowed = Interval.fromDateTimes(windowStart, windowEnd);
            return allowed.engulfs(appointment);
          });

          if (!withinWindow) {
            throw new ConflictException({
              errorCode: 'BOOKING_CONFLICT',
              message: 'startTime is not available in slots'
            });
          }

          const conflict = await this.bookingModel
            .findOne({
              businessId: input.businessId,
              staffId: resolvedStaffId,
              status: { $in: ['pending', 'confirmed'] },
              startTime: { $lt: end.toJSDate() },
              endTime: { $gt: start.toJSDate() }
            })
            .session(session)
            .exec();

          if (conflict) {
            throw new ConflictException({
              errorCode: 'BOOKING_CONFLICT',
              message: 'Requested slot is already booked'
            });
          }
        }

        const created = await this.bookingModel.create(
          [
            {
              customerUserId,
              isGuest,
              guestName: input.guestName,
              guestPhone: input.guestPhone,
              businessId: input.businessId,
              serviceId: input.serviceId,
              staffId: resolvedStaffId,
              startTime: start.toJSDate(),
              endTime: end.toJSDate(),
              mode: bookingMode,
              requestedStartTime: bookingMode === 'request' ? start.toJSDate() : undefined,
              status: 'pending',
              notes: input.notes,
              country: input.country,
              currency: service.currency ?? 'EUR',
              vatRate: service.vatRate,
              timezone
            }
          ],
          { session }
        );
        createdBooking = created[0] ?? null;
      });

      const booking = createdBooking as BookingDocument | null;
      if (booking?.guestPhone) {
        await this.smsService.sendBookingUpdate({
          toPhone: booking.guestPhone,
          event: 'created',
          bookingId: String(booking._id),
          startTime: booking.startTime.toISOString()
        });
      }
      return booking;
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: number }).code === 11000
      ) {
        throw new ConflictException({
          errorCode: 'BOOKING_CONFLICT',
          message: 'Requested slot is already booked'
        });
      }
      throw error;
    } finally {
      await session.endSession();
    }
  }

  listMine(userId: string, country: 'DE' = 'DE') {
    return this.bookingModel.find({ customerUserId: userId, country }).sort({ startTime: 1 }).exec();
  }

  listByBusiness(businessId: string, country: 'DE' = 'DE') {
    return this.bookingModel.find({ businessId, country }).sort({ startTime: 1 }).exec();
  }

  async cancel(id: string, dto: CancelBookingDto) {
    const booking = await this.bookingModel
      .findByIdAndUpdate(
        id,
        {
          status: 'cancelled',
          cancelReason: dto.reason
        },
        { new: true }
      )
      .exec();

    if (booking?.guestPhone) {
      await this.smsService.sendBookingUpdate({
        toPhone: booking.guestPhone,
        event: 'cancelled',
        bookingId: String(booking._id),
        startTime: booking.startTime.toISOString()
      });
    }
    return booking;
  }

  async confirm(id: string, dto: ConfirmBookingDto) {
    const booking = await this.bookingModel
      .findByIdAndUpdate(
        id,
        {
          status: 'confirmed',
          ...(dto.staffId ? { staffId: dto.staffId } : {}),
          ...(dto.note ? { notes: dto.note } : {})
        },
        { new: true }
      )
      .exec();

    if (booking?.guestPhone) {
      await this.smsService.sendBookingUpdate({
        toPhone: booking.guestPhone,
        event: 'confirmed',
        bookingId: String(booking._id),
        startTime: booking.startTime.toISOString()
      });
    }
    return booking;
  }

  async proposeCounter(id: string, dto: CounterProposalDto) {
    const booking = await this.bookingModel.findById(id).exec();
    if (!booking) {
      throw new NotFoundException({
        errorCode: 'BOOKING_NOT_FOUND',
        message: 'Booking not found'
      });
    }

    const service = await this.serviceModel.findById(booking.serviceId).exec();
    const durationMinutes = service?.durationMinutes ?? 60;
    const timezone = booking.timezone ?? 'Europe/Berlin';
    const proposedStart = DateTime.fromISO(dto.proposedStartTime, { setZone: true }).setZone(timezone);
    if (!proposedStart.isValid) {
      throw new BadRequestException({
        errorCode: 'INVALID_COUNTER_PROPOSAL',
        message: 'proposedStartTime is invalid'
      });
    }
    const proposedEnd = proposedStart.plus({ minutes: durationMinutes });

    const updated = await this.bookingModel
      .findByIdAndUpdate(
        id,
        {
          status: 'counter_proposed',
          counterProposedStartTime: proposedStart.toJSDate(),
          counterProposedEndTime: proposedEnd.toJSDate(),
          ...(dto.note ? { notes: dto.note } : {})
        },
        { new: true }
      )
      .exec();

    if (updated?.guestPhone) {
      await this.smsService.sendBookingUpdate({
        toPhone: updated.guestPhone,
        event: 'counter_proposed',
        bookingId: String(updated._id),
        startTime: proposedStart.toISO() ?? booking.startTime.toISOString()
      });
    }
    return updated;
  }

  async acceptCounter(id: string, dto: AcceptCounterProposalDto) {
    const booking = await this.bookingModel.findById(id).exec();
    if (!booking) {
      throw new NotFoundException({
        errorCode: 'BOOKING_NOT_FOUND',
        message: 'Booking not found'
      });
    }
    if (!booking.counterProposedStartTime || !booking.counterProposedEndTime) {
      throw new BadRequestException({
        errorCode: 'NO_COUNTER_PROPOSAL',
        message: 'No counter proposal available for this booking'
      });
    }

    const updated = await this.bookingModel
      .findByIdAndUpdate(
        id,
        {
          status: 'confirmed',
          startTime: booking.counterProposedStartTime,
          endTime: booking.counterProposedEndTime,
          ...(dto.note ? { notes: dto.note } : {})
        },
        { new: true }
      )
      .exec();

    if (updated?.guestPhone) {
      await this.smsService.sendBookingUpdate({
        toPhone: updated.guestPhone,
        event: 'confirmed',
        bookingId: String(updated._id),
        startTime: updated.startTime.toISOString()
      });
    }
    return updated;
  }

  async reject(id: string, dto: RejectBookingDto) {
    const updated = await this.bookingModel
      .findByIdAndUpdate(
        id,
        {
          status: 'rejected',
          ...(dto.reason ? { cancelReason: dto.reason } : {})
        },
        { new: true }
      )
      .exec();

    if (updated?.guestPhone) {
      await this.smsService.sendBookingUpdate({
        toPhone: updated.guestPhone,
        event: 'rejected',
        bookingId: String(updated._id),
        startTime: updated.startTime.toISOString()
      });
    }
    return updated;
  }

  private resolveWindowsForDate(
    availability: AvailabilityDocument | null,
    date: string,
    dayOfWeek: number,
    staffId: string
  ) {
    const overrides = availability?.specialDateOverrides ?? [];
    const staffOverride = overrides.find((o) => o.date === date && o.staffId === staffId);
    const globalOverride = overrides.find((o) => o.date === date && !o.staffId);

    if (staffOverride) {
      return staffOverride.isClosed ? [] : staffOverride.windows;
    }
    if (globalOverride) {
      return globalOverride.isClosed ? [] : globalOverride.windows;
    }

    const weekly = availability?.weeklySchedule ?? [];
    const staffWindows = weekly
      .filter((w) => w.dayOfWeek === dayOfWeek && (w.staffId ?? 'default') === staffId)
      .flatMap((w) => w.windows);
    if (staffWindows.length > 0) {
      return staffWindows;
    }

    if (staffId !== 'default') {
      return weekly
        .filter((w) => w.dayOfWeek === dayOfWeek && !w.staffId)
        .flatMap((w) => w.windows);
    }
    return [];
  }

  private toDateTime(dayStart: DateTime, hhmm: string): DateTime {
    const [h, m] = hhmm.split(':');
    return dayStart.set({ hour: Number(h), minute: Number(m), second: 0, millisecond: 0 });
  }
}
