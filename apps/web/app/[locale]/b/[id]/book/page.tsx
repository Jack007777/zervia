'use client';

import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';

import { SlotPicker } from '../../../../../src/components/SlotPicker';
import { useCountry } from '../../../../../src/hooks/useCountry';
import { useBusiness, useBusinessServices, useCreateBooking, useSlots } from '../../../../../src/lib/api/hooks';
import { getAccessToken } from '../../../../../src/lib/api/token-storage';
import { toApiCountry } from '../../../../../src/lib/country';
import { getMockBusinessById } from '../../../../../src/lib/mock-marketplace';
import { filterFutureSlots, formatBerlinDateTime } from '../../../../../src/lib/time';
import { uiCopy } from '../../../../../src/lib/ui-copy';

export default function BookingPage() {
  const { locale, id } = useParams<{ locale: 'de' | 'en'; id: string }>();
  const country = useCountry();

  const [serviceId, setServiceId] = useState('');
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [requestedDateTime, setRequestedDateTime] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [resultMessage, setResultMessage] = useState('');

  const apiCountry = toApiCountry(country);
  const businessQuery = useBusiness(id);
  const servicesQuery = useBusinessServices(id, apiCountry);
  const slotsQuery = useSlots(id, serviceId, date);
  const createBooking = useCreateBooking();

  const mockBusiness = getMockBusinessById(id);
  const business = businessQuery.data ?? mockBusiness;
  const bookingMode = business?.bookingMode ?? 'instant';
  const services = servicesQuery.data?.length ? servicesQuery.data : mockBusiness?.services ?? [];
  const selectedService = services.find((item) => item._id === serviceId);

  const slots = useMemo(() => {
    const data = slotsQuery.data;
    if (!data) {
      const baseDate = date || new Date().toISOString().slice(0, 10);
      return filterFutureSlots([
        `${baseDate}T09:00:00+01:00`,
        `${baseDate}T10:15:00+01:00`,
        `${baseDate}T11:30:00+01:00`
      ]);
    }
    if (Array.isArray(data)) {
      return filterFutureSlots(data);
    }
    return filterFutureSlots(Object.values(data).flat());
  }, [slotsQuery.data, date]);

  async function onConfirm() {
    const requestedStartTime =
      bookingMode === 'request'
        ? requestedDateTime
          ? new Date(requestedDateTime).toISOString()
          : ''
        : slot;

    if (!serviceId || !requestedStartTime || !name.trim() || !phone.trim() || !email.trim()) {
      setResultMessage(locale === 'de' ? 'Bitte alle Felder ausfuellen.' : 'Please fill in all required fields.');
      return;
    }

    const hasAuth = Boolean(getAccessToken());
    try {
      await createBooking.mutateAsync({
        businessId: id,
        serviceId,
        startTime: requestedStartTime,
        guestName: name.trim(),
        guestPhone: phone.trim(),
        notes: email.trim() ? `contactEmail=${email.trim()}` : undefined,
        country: apiCountry
      });
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Booking failed';
      if (text.includes('PHONE_VERIFICATION_REQUIRED')) {
        setResultMessage(
          locale === 'de'
            ? 'Diese Buchung erfordert ein telefonverifiziertes Konto. Bitte verifiziere zuerst deine Mobilnummer.'
            : 'This booking requires a phone-verified account. Please verify your mobile number first.'
        );
        return;
      }
      setResultMessage(locale === 'de' ? 'Buchung fehlgeschlagen.' : 'Booking failed.');
      return;
    }

    if (bookingMode === 'request') {
      setResultMessage(
        locale === 'de'
          ? 'Anfrage gesendet. Der Anbieter bestaetigt oder sendet einen Gegenvorschlag per SMS.'
          : 'Request sent. The business will confirm or send a counter proposal via SMS.'
      );
      return;
    }

    setResultMessage(
      hasAuth
        ? locale === 'de'
          ? 'Termin erfolgreich bestaetigt.'
          : 'Booking confirmed successfully.'
        : locale === 'de'
          ? 'Termin als Gast erstellt. SMS-Bestaetigung wurde versendet.'
          : 'Guest booking created. SMS confirmation has been sent.'
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
        {bookingMode === 'instant' ? (
          <>
            <input type="date" className="mt-2 w-full rounded-xl border p-3" value={date} onChange={(e) => setDate(e.target.value)} />
            <div className="mt-3">
              <SlotPicker slots={slots} selected={slot} onSelect={setSlot} />
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-slate-600">
              {locale === 'de'
                ? 'Verfuegbare Zeiten sind nicht oeffentlich. Sende deinen Wunschzeitpunkt.'
                : 'Available slots are hidden. Send your preferred appointment time.'}
            </p>
            <input
              type="datetime-local"
              className="mt-2 w-full rounded-xl border p-3"
              value={requestedDateTime}
              onChange={(e) => setRequestedDateTime(e.target.value)}
            />
          </>
        )}
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold">3. Your details</h2>
        {business?.requireVerifiedPhoneForBooking ? (
          <p className="mt-2 rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-700">
            {locale === 'de'
              ? 'Dieser Anbieter akzeptiert nur telefonverifizierte Konten.'
              : 'This business accepts bookings only from phone-verified accounts.'}
          </p>
        ) : null}
        <div className="mt-2 grid gap-2">
          <input className="rounded-xl border p-3" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="rounded-xl border p-3" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <input className="rounded-xl border p-3" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm text-sm">
        <h2 className="font-semibold">4. Confirm</h2>
        <p className="mt-2 text-slate-700">Service: {selectedService?.name ?? '-'}</p>
        <p className="text-slate-700">
          Time:{' '}
          {bookingMode === 'request'
            ? requestedDateTime
              ? formatBerlinDateTime(new Date(requestedDateTime).toISOString(), locale === 'de' ? 'de-DE' : 'en-GB')
              : '-'
            : slot
              ? formatBerlinDateTime(slot, locale === 'de' ? 'de-DE' : 'en-GB')
              : '-'}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Mode: {bookingMode === 'request' ? 'Request booking (merchant confirms/counter proposes)' : 'Instant booking'}
        </p>
        <p className="mt-2 rounded-md bg-slate-100 px-2 py-1 text-slate-600">{uiCopy[locale].paySoon}</p>
        <ul className="mt-3 space-y-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
          <li>{locale === 'de' ? 'Kostenlose Stornierung bis 24h vor Termin.' : 'Free cancellation up to 24h before appointment.'}</li>
          <li>{locale === 'de' ? 'Bei mehr als 15 Min. Verspätung kann der Termin verkürzt werden.' : 'If you are more than 15 min late, appointment time may be reduced.'}</li>
          <li>{locale === 'de' ? 'Deine Daten werden nur zur Terminabwicklung verwendet.' : 'Your data is only used for booking operations.'}</li>
        </ul>
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
