'use client';

import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';

import { BusinessCard } from '../../src/components/BusinessCard';
import { CategoryIcon } from '../../src/components/CategoryIcon';
import { LiveMap } from '../../src/components/LiveMap';
import { RatingStars } from '../../src/components/RatingStars';
import { useCountry } from '../../src/hooks/useCountry';
import { useSearchBusinesses } from '../../src/lib/api/hooks';
import type { Business, SearchParams } from '../../src/lib/api/types';
import { toApiCountry } from '../../src/lib/country';
import { getMockSearchPreview } from '../../src/lib/mock-marketplace';
import { uiCopy } from '../../src/lib/ui-copy';

type MainCategory = 'friseur' | 'naegel' | 'haarentfernung' | 'kosmetik' | 'massage' | 'maenner' | 'frauen';

type CategoryConfig = {
  label: string;
  allLabel: string;
  sub: string[];
};

const CATEGORY_MAP: Record<MainCategory, CategoryConfig> = {
  friseur: {
    label: 'Friseur',
    allLabel: 'Alle Friseur Behandlungen',
    sub: ['Damenhaarschnitt', 'Damen - Farbe, Toenung & Straehnen', 'Herrenhaarschnitt', 'Styling und Foehnen', 'Balayage', 'Kinderhaarschnitt']
  },
  naegel: {
    label: 'Naegel',
    allLabel: 'Alle Nagelbehandlungen',
    sub: ['Pedikuere', 'Manikuere', 'Nagel Design', 'Gel Manikuere', 'Naegel auffuellen', 'Nagelmodellage']
  },
  haarentfernung: {
    label: 'Haarentfernung',
    allLabel: 'Alle Haarentfernungen',
    sub: ['Waxing Damen', 'Brazilian Waxing', 'Sugaring', 'Waxing Herren', 'IPL - Dauerhafte Haarentfernung', 'Waxing Beine']
  },
  kosmetik: {
    label: 'Kosmetik',
    allLabel: 'Alle Kosmetik Behandlungen',
    sub: ['Gesichtsbehandlungen', 'Wimpernverlaengerung', 'Augenbrauen und Wimpern faerben', 'Augenbrauen zupfen', 'Wimpernwelle', 'Microdermabrasion']
  },
  massage: {
    label: 'Massage',
    allLabel: 'Alle Massagen',
    sub: ['Entspannungsmassage', 'Thai Massage', 'Aromaoel Massage', 'Therapeutische Massage', 'Fussmassage', 'Sportmassage']
  },
  maenner: {
    label: 'Maenner',
    allLabel: 'Alle Maenner Behandlungen',
    sub: ['Maennerhaarschnitte', 'Herren - Farbe', 'Bart trimmen & Rasur', 'Gesichtsbehandlungen fuer Maenner', 'Barbershop']
  },
  frauen: {
    label: 'Frauen',
    allLabel: 'Alle Frauen Behandlungen',
    sub: ['Damenhaarschnitt', 'Damen Waxing', 'Damen Massage', 'Gesichtsbehandlungen', 'Manikuere', 'Pedikuere']
  }
};

function SkeletonResults() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, idx) => (
        <div key={idx} className="h-20 animate-pulse rounded-xl bg-slate-200" />
      ))}
    </div>
  );
}

function TrustStrip({ data }: { data: Business[] }) {
  const avg = data.length ? data.reduce((acc, item) => acc + (item.avgRating ?? item.rating ?? 0), 0) / data.length : 4.8;
  const reviews = data.reduce((acc, item) => acc + (item.reviewCount ?? 0), 0);

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Trust</h2>
      <div className="mt-2 flex items-center gap-2">
        <RatingStars rating={avg} size="md" />
        <span className="font-semibold">{avg.toFixed(1)}</span>
        <span className="text-sm text-slate-600">({reviews} reviews)</span>
      </div>
      <p className="mt-2 text-sm text-slate-600">Verified ratings, transparent prices, and real availability.</p>
    </section>
  );
}

export default function HomePage() {
  const { locale } = useParams<{ locale: 'de' | 'en' }>();
  const country = useCountry();

  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');
  const [locationError, setLocationError] = useState('');
  const [serviceError, setServiceError] = useState('');
  const [radiusKm, setRadiusKm] = useState('');
  const [ratingMin, setRatingMin] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState('');
  const [gpsRequested, setGpsRequested] = useState(false);

  const [mainCategory, setMainCategory] = useState<MainCategory>('massage');
  const [subCategory, setSubCategory] = useState<string>('');
  const [subMenuOpen, setSubMenuOpen] = useState(false);
  const [submittedFilters, setSubmittedFilters] = useState<SearchParams | null>(null);

  const current = useMemo(() => CATEGORY_MAP[mainCategory], [mainCategory]);
  const { data, isLoading } = useSearchBusinesses(submittedFilters ?? {}, Boolean(submittedFilters));

  const previewData = useMemo(() => {
    const remote = data && data.length ? data : [];
    return (remote.length ? remote : getMockSearchPreview(6)).slice(0, 6);
  }, [data]);

  const mapCenter = useMemo(() => {
    if (gps) {
      return gps;
    }
    const firstWithGeo = previewData.find((item) => typeof item.lat === 'number' && typeof item.lng === 'number');
    if (firstWithGeo?.lat && firstWithGeo?.lng) {
      return { lat: firstWithGeo.lat, lng: firstWithGeo.lng };
    }
    return { lat: 52.52, lng: 13.405 };
  }, [previewData, gps]);

  function onSelectMain(next: MainCategory) {
    if (next === mainCategory) {
      setSubMenuOpen((prev) => !prev);
      return;
    }
    setMainCategory(next);
    setSubCategory('');
    setServiceError('');
    setSubMenuOpen(true);
  }

  function requestGpsLocation() {
    if (gpsRequested || !navigator.geolocation) {
      if (!navigator.geolocation) {
        setGpsStatus(locale === 'de' ? 'GPS wird auf diesem Geraet nicht unterstuetzt.' : 'GPS is not supported on this device.');
      }
      return;
    }

    setGpsRequested(true);
    setGpsStatus(locale === 'de' ? 'Standort wird abgefragt ...' : 'Requesting location ...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGps({ lat: Number(position.coords.latitude.toFixed(6)), lng: Number(position.coords.longitude.toFixed(6)) });
        setLocationError('');
        setGpsStatus(locale === 'de' ? 'GPS-Standort aktiv.' : 'GPS location enabled.');
      },
      () => setGpsStatus(locale === 'de' ? 'Standortzugriff abgelehnt. Bitte Stadt/PLZ eingeben.' : 'Location denied. Please enter city/zip.'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 120000 }
    );
  }

  function onSearch() {
    if (!subCategory) {
      setServiceError(locale === 'de' ? 'Bitte zuerst einen Service auswaehlen.' : 'Please select a service first.');
      return;
    }

    if (!city.trim() && !zip.trim() && !gps) {
      setLocationError(locale === 'de' ? 'Bitte Stadt/PLZ eingeben oder GPS erlauben.' : 'Enter city/zip or allow GPS.');
      return;
    }

    setServiceError('');
    setLocationError('');

    const params: SearchParams = {
      country: toApiCountry(country),
      category: mainCategory,
      q: subCategory,
      city: city.trim() || undefined,
      zip: zip.trim() || undefined,
      postalCode: zip.trim() || undefined,
      lat: gps?.lat,
      lng: gps?.lng,
      radiusKm: radiusKm ? Number(radiusKm) : undefined,
      ratingMin: ratingMin ? Number(ratingMin) : undefined,
      priceMin: priceMin ? Number(priceMin) : undefined,
      priceMax: priceMax ? Number(priceMax) : undefined,
      sort: 'recommended',
      page: 1,
      limit: 10
    };

    setSubmittedFilters(params);
  }

  const searchHref = useMemo(() => {
    const search = new URLSearchParams();
    search.set('country', toApiCountry(country));
    if (mainCategory) search.set('category', mainCategory);
    if (subCategory) search.set('q', subCategory);
    if (city.trim()) search.set('city', city.trim());
    if (zip.trim()) search.set('zip', zip.trim());
    if (gps) {
      search.set('lat', String(gps.lat));
      search.set('lng', String(gps.lng));
    }
    return `/${locale}/search?${search.toString()}`;
  }, [country, mainCategory, subCategory, city, zip, gps, locale]);

  return (
    <div className="space-y-4">
      <section className="rounded-3xl bg-gradient-to-br from-brand-700 to-brand-500 p-5 text-white">
        <h1 className="text-2xl font-semibold leading-tight">Book local services in minutes</h1>
        <p className="mt-2 text-sm text-blue-100">Germany-first booking platform for beauty, wellness and more.</p>
      </section>

      <TrustStrip data={previewData} />

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {(Object.keys(CATEGORY_MAP) as MainCategory[]).map((key) => {
            const active = key === mainCategory;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelectMain(key)}
                className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                  active ? 'border-brand-500 bg-blue-50 text-brand-700' : 'border-slate-200'
                }`}
              >
                <CategoryIcon category={key} />
                {CATEGORY_MAP[key].label}
              </button>
            );
          })}
        </div>

        {subMenuOpen ? (
          <div className="rounded-xl bg-slate-50 p-3">
            <ul className="space-y-2 text-sm">
              {current.sub.map((item) => (
                <li key={item}>
                  <button
                    type="button"
                    onClick={() => {
                      setSubCategory(item);
                      setServiceError('');
                    }}
                    className={`w-full rounded-lg px-2 py-1 text-left ${
                      subCategory === item ? 'bg-white font-semibold text-brand-700' : 'text-slate-700'
                    }`}
                  >
                    {item}
                  </button>
                </li>
              ))}
              <li className="pt-1 font-semibold text-slate-900">{current.allLabel}</li>
            </ul>
          </div>
        ) : (
          <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
            {locale === 'de' ? 'Klicke auf eine Kategorie, um Unterkategorien zu sehen.' : 'Click a category to view subcategories.'}
          </p>
        )}
      </section>

      <section className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <label className="grid gap-1 text-sm text-slate-600">
          {locale === 'de' ? 'Stadt (oder GPS)' : 'City (or GPS)'}
          <input
            className="rounded-xl border p-3"
            placeholder={locale === 'de' ? 'z. B. Berlin' : 'e.g. Berlin'}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onFocus={requestGpsLocation}
            onClick={requestGpsLocation}
          />
        </label>

        <label className="grid gap-1 text-sm text-slate-600">
          PLZ / ZIP
          <input
            className="rounded-xl border p-3"
            placeholder={locale === 'de' ? 'z. B. 10115' : 'e.g. 10115'}
            inputMode="numeric"
            value={zip}
            onChange={(e) => setZip(e.target.value)}
          />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <input className="rounded-xl border p-3" type="number" min="1" placeholder="Distanz (km)" value={radiusKm} onChange={(e) => setRadiusKm(e.target.value)} />
          <input
            className="rounded-xl border p-3"
            type="number"
            min="1"
            max="5"
            step="0.1"
            placeholder="Min Bewertung"
            value={ratingMin}
            onChange={(e) => setRatingMin(e.target.value)}
          />
          <input className="rounded-xl border p-3" type="number" min="0" placeholder="Preis min" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} />
          <input className="rounded-xl border p-3" type="number" min="0" placeholder="Preis max" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} />
        </div>

        <button type="button" className="rounded-xl bg-brand-500 p-4 text-base font-semibold text-white" onClick={onSearch}>
          {uiCopy[locale].ctaSearch}
        </button>
        <a href={searchHref} className="rounded-xl border p-3 text-center text-sm font-medium text-slate-700">
          {uiCopy[locale].ctaViewAll}
        </a>

        {serviceError ? <p className="text-xs text-rose-600">{serviceError}</p> : null}
        {gpsStatus ? <p className="text-xs text-slate-600">{gpsStatus}</p> : null}
        {locationError ? <p className="text-xs text-rose-600">{locationError}</p> : null}
      </section>

      <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">{uiCopy[locale].sampleResultsTitle}</h2>
        {isLoading ? <SkeletonResults /> : null}
        {!isLoading && previewData.length === 0 ? (
          <div className="space-y-2 rounded-xl border border-dashed p-3 text-sm">
            <p className="font-medium">{uiCopy[locale].emptyTitle}</p>
            <p className="text-slate-600">{uiCopy[locale].emptyBody}</p>
            <ul className="space-y-1 text-brand-700">
              {uiCopy[locale].emptyActions.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {!isLoading ? previewData.slice(0, submittedFilters ? 6 : 3).map((business) => <BusinessCard key={business._id} locale={locale} business={business} />) : null}
      </section>

      {submittedFilters ? <LiveMap lat={mapCenter.lat} lng={mapCenter.lng} /> : null}
    </div>
  );
}
