import { DateTime, Settings } from 'luxon';

import { AvailabilityService } from './availability.service';

describe('AvailabilityService.getSlots', () => {
  const availabilityModel = {
    findOne: jest.fn()
  };
  const serviceModel = {
    findOne: jest.fn()
  };
  const bookingModel = {
    find: jest.fn()
  };

  const makeBookingQuery = (result: unknown[]) => ({
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(result)
  });

  const sut = new AvailabilityService(
    availabilityModel as never,
    serviceModel as never,
    bookingModel as never
  );

  beforeEach(() => {
    jest.clearAllMocks();
    Settings.now = () => new Date('2026-02-28T11:00:00.000Z').valueOf();
  });

  afterAll(() => {
    Settings.now = () => Date.now();
  });

  it('returns 15-minute slots for a normal day', async () => {
    availabilityModel.findOne.mockReturnValue({
      lean: () => ({
        exec: async () => ({
          businessId: 'biz_1',
          timezone: 'Europe/Berlin',
          weeklySchedule: [
            { dayOfWeek: 7, staffId: 'staff_1', windows: [{ start: '10:00', end: '11:00' }] }
          ],
          specialDateOverrides: []
        })
      })
    });
    serviceModel.findOne.mockReturnValue({
      lean: () => ({
        exec: async () => ({
          _id: 'svc_1',
          businessId: 'biz_1',
          durationMinutes: 30
        })
      })
    });
    bookingModel.find.mockReturnValue(makeBookingQuery([]));

    const result = await sut.getSlots('biz_1', {
      serviceId: 'svc_1',
      date: '2026-03-01',
      staffId: 'staff_1'
    });

    expect(result).toEqual([
      '2026-03-01T10:00:00+01:00',
      '2026-03-01T10:15:00+01:00',
      '2026-03-01T10:30:00+01:00'
    ]);
  });

  it('returns empty slots when special date is closed', async () => {
    availabilityModel.findOne.mockReturnValue({
      lean: () => ({
        exec: async () => ({
          businessId: 'biz_1',
          timezone: 'Europe/Berlin',
          weeklySchedule: [
            { dayOfWeek: 7, staffId: 'staff_1', windows: [{ start: '10:00', end: '11:00' }] }
          ],
          specialDateOverrides: [{ date: '2026-03-01', staffId: 'staff_1', isClosed: true, windows: [] }]
        })
      })
    });
    serviceModel.findOne.mockReturnValue({
      lean: () => ({
        exec: async () => ({
          _id: 'svc_1',
          businessId: 'biz_1',
          durationMinutes: 30
        })
      })
    });
    bookingModel.find.mockReturnValue(makeBookingQuery([]));

    const result = await sut.getSlots('biz_1', {
      serviceId: 'svc_1',
      date: '2026-03-01',
      staffId: 'staff_1'
    });

    expect(result).toEqual([]);
  });

  it('excludes pending/confirmed conflicting bookings', async () => {
    availabilityModel.findOne.mockReturnValue({
      lean: () => ({
        exec: async () => ({
          businessId: 'biz_1',
          timezone: 'Europe/Berlin',
          weeklySchedule: [
            { dayOfWeek: 7, staffId: 'staff_1', windows: [{ start: '10:00', end: '11:00' }] }
          ],
          specialDateOverrides: []
        })
      })
    });
    serviceModel.findOne.mockReturnValue({
      lean: () => ({
        exec: async () => ({
          _id: 'svc_1',
          businessId: 'biz_1',
          durationMinutes: 30
        })
      })
    });

    const zone = 'Europe/Berlin';
    bookingModel.find.mockReturnValue(
      makeBookingQuery([
        {
          staffId: 'staff_1',
          startTime: DateTime.fromISO('2026-03-01T10:15:00', { zone }).toJSDate(),
          endTime: DateTime.fromISO('2026-03-01T10:45:00', { zone }).toJSDate(),
          status: 'confirmed'
        }
      ])
    );

    const result = await sut.getSlots('biz_1', {
      serviceId: 'svc_1',
      date: '2026-03-01',
      staffId: 'staff_1'
    });

    expect(result).toEqual([]);
  });
});
