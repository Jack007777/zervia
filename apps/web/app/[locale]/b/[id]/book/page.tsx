'use client';

import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';

import { SlotPicker } from '../../../../../src/components/SlotPicker';
import { useCountry } from '../../../../../src/hooks/useCountry';
import { useBusinessServices, useCreateBooking, useSlots } from '../../../../../src/lib/api/hooks';
import { getAccessToken } from '../../../../../src/lib/api/token-storage';
import { toApiCountry } from '../../../../../src/lib/country';
import { getMockBusinessById } from '../../../../../src/lib/mock-marketplace';
import { uiCopy } from '../../../../../src/lib/ui-copy';

export default function BookingPage() {
  const { locale, id } = useParams<{ locale: 'de' | 'en'; id: string }>();
  const country = useCountry();

  const [serviceId, setServiceId] = useState('');
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [resultMessage, setResultMessage] = useState('');

  const apiCountry = toApiCountry(country);
  const servicesQuery = useBusinessServices(id, apiCountry);
  const slotsQuery = useSlots(id, serviceId, date);
  const createBooking = useCreateBooking();

  const mockBusiness = getMockBusinessById(id);
  const services = servicesQuery.data?.length ? servicesQuery.data : mockBusiness?.services ?? [];
  const selectedService = services.find((item) => item._id === serviceId);

  const slots = useMemo(() => {
    const data = slotsQuery.data;
    if (!data) {
      return [
        `${date || '2026-03-03'}T09:00:00+01:00`,
        `${date || '2026-03-03'}T10:15:00+01:00`,
        `${date || '2026-03-03'}T11:30:00+01:00`
      ];
    }
    if (Array.isArray(data)) {
      return data;
    }
    return Object.values(data).flat();
  }, [slotsQuery.data, date]);

  async function onConfirm() {
    if (!serviceId || !slot || !name.trim() || !phone.trim() || !email.trim()) {
      setResultMessage(locale === 'de' ? 'Bitte alle Felder ausfuellen.' : 'Please fill in all required fields.');
      return;
    }

    const hasAuth = Boolean(getAccessToken());

    if (hasAuth) {
      await createBooking.mutateAsync({
        businessId: id,
        serviceId,
        startTime: slot,
        country: apiCountry
      });
      setResultMessage(locale === 'de' ? 'Termin erfolgreich bestaetigt.' : 'Booking confirmed successfully.');
      return;
    }

    setResultMessage(
      locale === 'de'
        ? 'Termin als Gast vorgemerkt. SMS/Email-Bestaetigung folgt (MVP-Modus).'
        : 'Guest booking request submitted. SMS/email confirmation will follow (MVP mode).'
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h1 className="font-semibold">1. Select service</h1>
        <div className="mt-2 grid gap-2">
          {services.map((service) => (
            <button
              key={service._id}
              className={`rounded-xl border p-3 text-left ${serviceId === service._id ? 'border-brand-500 bg-blue-50' : ''}`}
              onClick={() => setServiceId(service._id)}
            >
              <div className="flex items-center justify-between">
                <span>{service.name}</span>
                <span className="text-sm">
                  {service.currency} {service.price}
                </span>
              </div>
              <p className="text-xs text-slate-500">{service.durationMinutes} min</p>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold">2. Select date and time</h2>
        <input type="date" className="mt-2 w-full rounded-xl border p-3" value={date} onChange={(e) => setDate(e.target.value)} />
        <div className="mt-3">
          <SlotPicker slots={slots} selected={slot} onSelect={setSlot} />
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold">3. Your details</h2>
        <div className="mt-2 grid gap-2">
          <input className="rounded-xl border p-3" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="rounded-xl border p-3" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <input className="rounded-xl border p-3" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm text-sm">
        <h2 className="font-semibold">4. Confirm</h2>
        <p className="mt-2 text-slate-700">Service: {selectedService?.name ?? '-'}</p>
        <p className="text-slate-700">Time: {slot ? new Date(slot).toLocaleString() : '-'}</p>
        <p className="mt-2 rounded-md bg-slate-100 px-2 py-1 text-slate-600">{uiCopy[locale].paySoon}</p>
      </section>

      <button
        className="w-full rounded-xl bg-brand-500 p-3 font-medium text-white disabled:bg-slate-300"
        onClick={onConfirm}
        disabled={createBooking.isPending}
      >
        {createBooking.isPending ? 'Submitting...' : 'Confirm booking'}
      </button>

      {resultMessage ? <p className="rounded-xl bg-white p-3 text-sm shadow-sm">{resultMessage}</p> : null}
    </div>
  );
}
