import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getMockBusinessById, getMockBusinessBySlug } from '../../../../src/lib/mock-marketplace';
import { formatBerlinDateTime } from '../../../../src/lib/time';

type Params = { locale: 'de' | 'en'; slug: string };

type ApiBusiness = {
  _id: string;
  name: string;
  description?: string;
  addressLine?: string;
  city?: string;
  country?: string;
  rating?: number;
  avgRating?: number;
  reviewCount?: number;
  openingHours?: Array<{ day: string; open: string; close: string; closed?: boolean }>;
  cancellationPolicy?: string;
};

type ApiService = {
  _id: string;
  name: string;
  durationMinutes: number;
  price: number;
  currency: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api.zervia.eu/api/v1';

function isObjectId(value: string) {
  return /^[a-f0-9]{24}$/i.test(value);
}

async function fetchBusinessById(id: string): Promise<ApiBusiness | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);
  try {
    const response = await fetch(`${API_BASE_URL}/business/${encodeURIComponent(id)}?country=DE`, {
      cache: 'no-store',
      signal: controller.signal
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as ApiBusiness;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchServicesByBusinessId(id: string): Promise<ApiService[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);
  try {
    const response = await fetch(`${API_BASE_URL}/business/${encodeURIComponent(id)}/services?country=DE`, {
      cache: 'no-store',
      signal: controller.signal
    });
    if (!response.ok) {
      return [];
    }
    return (await response.json()) as ApiService[];
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

export default async function BusinessSlugPage({ params }: { params: Promise<Params> }) {
  const { locale, slug } = await params;

  const mockBySlug = getMockBusinessBySlug(slug);
  const mockById = getMockBusinessById(slug);
  const mockBusiness = mockBySlug ?? mockById;
  const apiBusiness = isObjectId(slug) ? await fetchBusinessById(slug) : null;

  const business = apiBusiness ?? mockBusiness;
  if (!business) {
    notFound();
  }

  const services =
    (apiBusiness ? await fetchServicesByBusinessId(apiBusiness._id) : []) ||
    [];

  const fallbackServices = mockBusiness?.services ?? [];
  const serviceList = services.length ? services : fallbackServices;

  const rating = business.avgRating ?? business.rating ?? 0;
  const reviewCount = business.reviewCount ?? (mockBusiness?.reviews?.length ?? 0);
  const bookId = apiBusiness?._id ?? mockBusiness?._id ?? slug;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h1 className="text-xl font-semibold">{business.name}</h1>
        <p className="mt-2 text-sm text-slate-600">{business.description ?? (locale === 'de' ? 'Keine Beschreibung verfügbar.' : 'No description available.')}</p>
        <p className="mt-2 text-sm text-slate-700">{business.addressLine ?? '-'}</p>
        <p className="mt-1 text-sm text-slate-700">
          {(locale === 'de' ? 'Bewertung' : 'Rating')}: {rating.toFixed(1)} ({reviewCount})
        </p>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-medium">{locale === 'de' ? 'Öffnungszeiten' : 'Opening hours'}</h2>
        <ul className="mt-2 space-y-1 text-sm text-slate-700">
          {(business.openingHours ?? []).map((row) => (
            <li key={row.day} className="flex justify-between">
              <span>{row.day}</span>
              <span>{row.closed ? (locale === 'de' ? 'Geschlossen' : 'Closed') : `${row.open} - ${row.close}`}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-medium">{locale === 'de' ? 'Leistungen' : 'Services'}</h2>
        {serviceList.length === 0 ? <p className="mt-2 text-sm text-slate-600">{locale === 'de' ? 'Noch keine Leistungen verfügbar.' : 'No services yet.'}</p> : null}
        <div className="mt-2 grid gap-2">
          {serviceList.map((service) => (
            <div key={service._id} className="rounded-xl border p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{service.name}</span>
                <span>
                  {service.currency} {service.price}
                </span>
              </div>
              <p className="text-slate-600">{service.durationMinutes} min</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 text-sm shadow-sm">
        <h2 className="font-medium">{locale === 'de' ? 'Stornierungsrichtlinie' : 'Cancellation policy'}</h2>
        <p className="mt-2 text-slate-700">
          {business.cancellationPolicy ?? (locale === 'de' ? 'Kostenlose Stornierung bis 24 Stunden vor dem Termin.' : 'Free cancellation up to 24h before appointment.')}
        </p>
      </section>

      <div className="rounded-2xl bg-white p-4 text-sm text-slate-700 shadow-sm">
        {locale === 'de' ? 'Nächster verfügbarer Termin:' : 'Next available time:'} {formatBerlinDateTime(mockBusiness?.earliestSlot, locale === 'de' ? 'de-DE' : 'en-GB')}
      </div>

      <Link href={`/${locale}/b/${bookId}/book`} className="block rounded-xl bg-brand-500 p-3 text-center font-medium text-white">
        {locale === 'de' ? 'Jetzt buchen' : 'Book now'}
      </Link>
    </div>
  );
}
