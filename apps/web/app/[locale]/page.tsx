'use client';

import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

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

type LocationSuggestion = {
  placeId: string;
  label: string;
  lat: number;
  lng: number;
};
const ALL_SUBCATEGORY = '__ALL__';

const CATEGORY_MAP: Record<MainCategory, CategoryConfig> = {
  friseur: {
    label: 'Friseur',
    allLabel: 'Alle Friseur Behandlungen',
    sub: ['Damenhaarschnitt', 'Damen - Farbe, Tönung & Strähnen', 'Herrenhaarschnitt', 'Styling und Föhnen', 'Balayage', 'Kinderhaarschnitt']
  },
  naegel: {
    label: 'Nägel',
    allLabel: 'Alle Nagelbehandlungen',
    sub: ['Pediküre', 'Maniküre', 'Nageldesign', 'Gel-Maniküre', 'Nägel auffüllen', 'Nagelmodellage']
  },
  haarentfernung: {
    label: 'Haarentfernung',
    allLabel: 'Alle Haarentfernungen',
    sub: ['Waxing Damen', 'Brazilian Waxing', 'Sugaring', 'Waxing Herren', 'IPL - Dauerhafte Haarentfernung', 'Waxing Beine']
  },
  kosmetik: {
    label: 'Kosmetik',
    allLabel: 'Alle Kosmetik Behandlungen',
    sub: ['Gesichtsbehandlungen', 'Wimpernverlängerung', 'Augenbrauen und Wimpern färben', 'Augenbrauen zupfen', 'Wimpernwelle', 'Mikrodermabrasion']
  },
  massage: {
    label: 'Massage',
    allLabel: 'Alle Massagen',
    sub: ['Entspannungsmassage', 'Thai Massage', 'Aromaöl Massage', 'Therapeutische Massage', 'Fußmassage', 'Sportmassage']
  },
  maenner: {
    label: 'Männer',
    allLabel: 'Alle Männer Behandlungen',
    sub: ['Männerhaarschnitte', 'Herren - Farbe', 'Bart trimmen & Rasur', 'Gesichtsbehandlungen für Männer', 'Barbershop']
  },
  frauen: {
    label: 'Frauen',
    allLabel: 'Alle Frauen Behandlungen',
    sub: ['Damenhaarschnitt', 'Damen Waxing', 'Damen Massage', 'Gesichtsbehandlungen', 'Maniküre', 'Pediküre']
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

  const [locationQuery, setLocationQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [isLocationSuggestLoading, setIsLocationSuggestLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [serviceError, setServiceError] = useState('');
  const [radiusKm, setRadiusKm] = useState('');
  const [ratingMin, setRatingMin] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState('');
  const [gpsStatusType, setGpsStatusType] = useState<'loading' | 'success' | 'error' | ''>('');
  const [isLocating, setIsLocating] = useState(false);

  const [mainCategory, setMainCategory] = useState<MainCategory>('massage');
  const [subCategory, setSubCategory] = useState<string>('');
  const [subMenuOpen, setSubMenuOpen] = useState(false);
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [submittedFilters, setSubmittedFilters] = useState<SearchParams | null>(null);
  const [showResults, setShowResults] = useState(false);

  const current = useMemo(() => CATEGORY_MAP[mainCategory], [mainCategory]);
  const { data, isLoading } = useSearchBusinesses(submittedFilters ?? {}, Boolean(submittedFilters));

  const previewData = useMemo(() => {
    if (!showResults) {
      return [];
    }
    const hasSubmittedQuery = Boolean(submittedFilters);
    const remote = data && data.length ? data : [];
    if (remote.length) {
      return remote.slice(0, 6);
    }
    if (gps && !hasSubmittedQuery) {
      return [];
    }
    if (!hasSubmittedQuery) {
      return getMockSearchPreview(6);
    }
    return [];
  }, [data, submittedFilters, gps, showResults]);

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

  const mapMarkers = useMemo(
    () =>
      previewData
        .filter((item) => typeof item.lat === 'number' && typeof item.lng === 'number')
        .map((item) => ({
          id: item._id,
          name: item.name,
          lat: item.lat as number,
          lng: item.lng as number
        })),
    [previewData]
  );

  useEffect(() => {
    const query = locationQuery.trim();
    if (!query || query.startsWith('GPS:') || query.length < 3) {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
      setIsLocationSuggestLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsLocationSuggestLoading(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=de&limit=6&q=${encodeURIComponent(
          query
        )}`;
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'accept-language': locale === 'de' ? 'de' : 'en'
          }
        });
        if (!response.ok) {
          setLocationSuggestions([]);
          setShowLocationSuggestions(false);
          return;
        }
        const payload = (await response.json()) as Array<{
          place_id: number | string;
          display_name: string;
          lat: string;
          lon: string;
        }>;
        const next = payload.map((item) => ({
          placeId: String(item.place_id),
          label: item.display_name,
          lat: Number(item.lat),
          lng: Number(item.lon)
        }));
        setLocationSuggestions(next);
        setShowLocationSuggestions(true);
      } catch {
        setLocationSuggestions([]);
        setShowLocationSuggestions(false);
      } finally {
        setIsLocationSuggestLoading(false);
      }
    }, 280);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [locationQuery, locale]);

  function onSelectMain(next: MainCategory) {
    setCategoryTouched(true);
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
    if (!navigator.geolocation) {
      setGpsStatus(locale === 'de' ? 'GPS wird auf diesem Geraet nicht unterstuetzt.' : 'GPS is not supported on this device.');
      setGpsStatusType('error');
      return;
    }

    if (isLocating) {
      setGpsStatus(locale === 'de' ? 'Standort wird noch abgefragt ...' : 'Still requesting location ...');
      setGpsStatusType('loading');
      return;
    }

    setIsLocating(true);
    setGpsStatus(locale === 'de' ? 'Standort wird abgefragt ...' : 'Requesting location ...');
    setGpsStatusType('loading');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextGps = {
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6))
        };
        const nextCategory = categoryTouched ? mainCategory : undefined;
        const nextQuery = subCategory && subCategory !== ALL_SUBCATEGORY ? subCategory : undefined;
        setGps(nextGps);
        setLocationQuery(`GPS: ${nextGps.lat}, ${nextGps.lng}`);
        setLocationError('');
        setGpsStatus(locale === 'de' ? 'GPS-Standort aktiv.' : 'GPS location enabled.');
        setGpsStatusType('success');
        setSubmittedFilters({
          country: toApiCountry(country),
          category: nextCategory,
          q: nextQuery,
          lat: nextGps.lat,
          lng: nextGps.lng,
          radiusKm: radiusKm ? Number(radiusKm) : 120,
          ratingMin: ratingMin ? Number(ratingMin) : undefined,
          priceMin: priceMin ? Number(priceMin) : undefined,
          priceMax: priceMax ? Number(priceMax) : undefined,
          sort: 'recommended',
          page: 1,
          limit: 10
        });
        setShowResults(true);
        setIsLocating(false);
      },
      () => {
        setGpsStatus(locale === 'de' ? 'Standortzugriff abgelehnt. Bitte Stadt/PLZ eingeben.' : 'Location denied. Please enter city/zip.');
        setGpsStatusType('error');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 120000 }
    );
  }

  function onSearch() {
    const rawLocation = locationQuery.trim();
    const isGpsLabel = rawLocation.startsWith('GPS:');
    const normalizedLocation = isGpsLabel ? '' : rawLocation;
    const resolvedCity = normalizedLocation || (!gps ? '' : '');
    const isZipOnly = /^\d{4,6}$/.test(rawLocation);
    const resolvedQuery = subCategory && subCategory !== ALL_SUBCATEGORY ? subCategory : '';

    if (!subCategory) {
      setServiceError(
        locale === 'de' ? `Keine Unterkategorie gewaehlt. Wir suchen nach: ${resolvedQuery}.` : `No subcategory selected. Searching for: ${resolvedQuery}.`
      );
    } else {
      setServiceError('');
    }

    if (!rawLocation && !gps) {
      setLocationError(locale === 'de' ? 'Bitte gib einen Ort an oder nutze GPS.' : 'Please enter a location or use GPS.');
      return;
    } else {
      setLocationError('');
    }

    const resolvedRadiusKm = radiusKm ? Number(radiusKm) : gps ? 120 : undefined;

    const params: SearchParams = {
      country: toApiCountry(country),
      category: categoryTouched ? mainCategory : undefined,
      q: resolvedQuery || undefined,
      city: resolvedCity || undefined,
      zip: isZipOnly ? normalizedLocation : undefined,
      postalCode: isZipOnly ? normalizedLocation : undefined,
      lat: gps?.lat,
      lng: gps?.lng,
      radiusKm: resolvedRadiusKm,
      ratingMin: ratingMin ? Number(ratingMin) : undefined,
      priceMin: priceMin ? Number(priceMin) : undefined,
      priceMax: priceMax ? Number(priceMax) : undefined,
      sort: 'recommended',
      page: 1,
      limit: 10
    };

    setSubmittedFilters(params);
    setShowResults(true);
  }

  const searchHref = useMemo(() => {
    const search = new URLSearchParams();
    search.set('country', toApiCountry(country));
    if (categoryTouched && mainCategory) search.set('category', mainCategory);
    if (subCategory && subCategory !== ALL_SUBCATEGORY) search.set('q', subCategory);
    const rawLocation = locationQuery.trim();
    if (rawLocation && !rawLocation.startsWith('GPS:')) {
      search.set('city', rawLocation);
      if (/^\d{4,6}$/.test(rawLocation)) {
        search.set('zip', rawLocation);
      }
    }
    if (gps) {
      search.set('lat', String(gps.lat));
      search.set('lng', String(gps.lng));
      if (!radiusKm) {
        search.set('radiusKm', '120');
      }
    }
    if (radiusKm) {
      search.set('radiusKm', radiusKm);
    }
    return `/${locale}/search?${search.toString()}`;
  }, [country, mainCategory, subCategory, locationQuery, gps, locale, categoryTouched, radiusKm]);

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
                      setCategoryTouched(true);
                      setServiceError('');
                      setSubMenuOpen(false);
                    }}
                    className={`w-full rounded-lg border px-2 py-2 text-left transition ${
                      subCategory === item
                        ? 'border-brand-300 bg-white font-semibold text-brand-700'
                        : 'border-transparent text-slate-700 hover:border-slate-200 hover:bg-white'
                    }`}
                    aria-pressed={subCategory === item}
                  >
                    <span className="flex items-center justify-between">
                      <span>{item}</span>
                      {subCategory === item ? <span className="text-xs">✓</span> : null}
                    </span>
                  </button>
                </li>
              ))}
              <li className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setSubCategory(ALL_SUBCATEGORY);
                    setCategoryTouched(true);
                    setServiceError('');
                    setSubMenuOpen(false);
                  }}
                  className={`w-full rounded-lg border px-2 py-2 text-left font-semibold transition ${
                    subCategory === ALL_SUBCATEGORY
                      ? 'border-brand-300 bg-white text-brand-700'
                      : 'border-transparent text-slate-900 hover:border-slate-200 hover:bg-white'
                  }`}
                >
                  <span className="flex items-center justify-between">
                    <span>{current.allLabel}</span>
                    {subCategory === ALL_SUBCATEGORY ? <span className="text-xs">✓</span> : null}
                  </span>
                </button>
              </li>
            </ul>
          </div>
        ) : (
          <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
            {locale === 'de' ? 'Klicke auf eine Kategorie, um Unterkategorien zu sehen.' : 'Click a category to view subcategories.'}
          </p>
        )}
      </section>

      <section className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm">
        {subCategory ? (
          <div className="flex items-center justify-between rounded-xl border border-brand-200 bg-blue-50 px-3 py-2 text-sm text-brand-800">
            <span>
              {locale === 'de' ? 'Gewählte Unterkategorie:' : 'Selected subcategory:'}{' '}
              <strong>{subCategory === ALL_SUBCATEGORY ? current.allLabel : subCategory}</strong>
            </span>
            <button
              type="button"
              className="rounded-md border border-brand-300 px-2 py-1 text-xs"
              onClick={() => setSubCategory('')}
            >
              {locale === 'de' ? 'Zurücksetzen' : 'Clear'}
            </button>
          </div>
        ) : null}
        <label className="grid gap-1 text-sm text-slate-600">
          {locale === 'de' ? 'PLZ, Ort oder Region' : 'ZIP, city or region'}
          <input
            className="rounded-xl border p-3"
            placeholder={locale === 'de' ? 'PLZ, Ort oder Region eingeben' : 'Enter ZIP, city or region'}
            value={locationQuery}
            onChange={(e) => {
              setLocationQuery(e.target.value);
              setGps(null);
            }}
            onFocus={() => {
              if (locationSuggestions.length > 0) {
                setShowLocationSuggestions(true);
              }
            }}
          />
          {isLocationSuggestLoading ? <p className="text-xs text-slate-500">{locale === 'de' ? 'Suche Adressen ...' : 'Searching addresses ...'}</p> : null}
          {showLocationSuggestions && locationSuggestions.length > 0 ? (
            <div className="max-h-56 overflow-auto rounded-xl border bg-white shadow-sm">
              {locationSuggestions.map((suggestion) => (
                <button
                  key={suggestion.placeId}
                  type="button"
                  className="block w-full border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-slate-50"
                  onClick={() => {
                    setLocationQuery(suggestion.label);
                    setGps({
                      lat: Number(suggestion.lat.toFixed(6)),
                      lng: Number(suggestion.lng.toFixed(6))
                    });
                    setShowLocationSuggestions(false);
                    setLocationSuggestions([]);
                    setGpsStatus(
                      locale === 'de'
                        ? 'Adresse ausgewählt. Du kannst jetzt suchen.'
                        : 'Address selected. You can search now.'
                    );
                    setGpsStatusType('success');
                  }}
                >
                  {suggestion.label}
                </button>
              ))}
            </div>
          ) : null}
        </label>
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium text-slate-700"
          onClick={requestGpsLocation}
        >
          <span aria-hidden>◎</span>
          {locale === 'de' ? 'Aktueller Standort' : 'Current location'}
        </button>

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
        {gpsStatus ? (
          <p
            className={`rounded-lg px-2 py-1 text-xs ${
              gpsStatusType === 'success'
                ? 'bg-emerald-50 text-emerald-700'
                : gpsStatusType === 'error'
                  ? 'bg-rose-50 text-rose-700'
                  : 'bg-slate-100 text-slate-700'
            }`}
          >
            {gpsStatus}
          </p>
        ) : null}
        {locationError ? <p className="text-xs text-rose-600">{locationError}</p> : null}
      </section>

      <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">{uiCopy[locale].sampleResultsTitle}</h2>
        {!showResults ? (
          <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
            {locale === 'de' ? 'Bitte suche nach Standort oder nutze GPS, um Ergebnisse zu sehen.' : 'Search by location or use GPS to see results.'}
          </p>
        ) : null}
        {isLoading ? <SkeletonResults /> : null}
        {showResults && !isLoading && previewData.length === 0 ? (
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
        {showResults && !isLoading ? previewData.slice(0, submittedFilters ? 6 : 3).map((business) => <BusinessCard key={business._id} locale={locale} business={business} />) : null}
      </section>

      {submittedFilters || gps ? <LiveMap lat={mapCenter.lat} lng={mapCenter.lng} markers={mapMarkers} /> : null}
    </div>
  );
}
