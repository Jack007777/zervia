'use client';

import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';

import { SlotPicker } from '../../../../../src/components/SlotPicker';
import { useCountry } from '../../../../../src/hooks/useCountry';
import { useBusinessServices, useCreateBooking, useSlots } from '../../../../../src/lib/api/hooks';
import { toApiCountry } from '../../../../../src/lib/country';

export default function BookingPage() {
  const { id } = useParams<{ id: string }>();
  const country = useCountry();
  const [serviceId, setServiceId] = useState('');
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const apiCountry = toApiCountry(country);
  const servicesQuery = useBusinessServices(id, apiCountry);
  const slotsQuery = useSlots(id, serviceId, date);
  const createBooking = useCreateBooking();

  const services = servicesQuery.data ?? [];
  const slots = useMemo(() => {
    const data = slotsQuery.data;
    if (!data) {
      return [];
    }
    if (Array.isArray(data)) {
      return data;
    }
    return Object.values(data).flat();
  }, [slotsQuery.data]);

  async function onConfirm() {
    if (!serviceId || !slot) {
      return;
    }
    await createBooking.mutateAsync({
      businessId: id,
      serviceId,
      startTime: slot,
      country: apiCountry
    });
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h1 className="font-semibold">Select service</h1>
        <div className="mt-2 grid gap-2">
          {services.map((service) => (
            <button
              key={service._id}
              className={`rounded-xl border p-3 text-left ${
                serviceId === service._id ? 'border-brand-500 bg-blue-50' : ''
              }`}
              onClick={() => setServiceId(service._id)}
            >
              {service.name} ({service.durationMinutes} min)
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold">Select date</h2>
        <input
          type="date"
          className="mt-2 w-full rounded-xl border p-3"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold">Select time</h2>
        <div className="mt-3">
          <SlotPicker slots={slots} selected={slot} onSelect={setSlot} />
        </div>
      </section>

      <button
        className="w-full rounded-xl bg-brand-500 p-3 font-medium text-white disabled:bg-slate-300"
        onClick={onConfirm}
        disabled={!serviceId || !slot || createBooking.isPending}
      >
        Confirm booking
      </button>
    </div>
  );
}
