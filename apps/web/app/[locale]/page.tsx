'use client';

import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';

import { BusinessCard } from '../../src/components/BusinessCard';
import { CategoryIcon } from '../../src/components/CategoryIcon';
import { LiveMap } from '../../src/components/LiveMap';
import { useCountry } from '../../src/hooks/useCountry';
import { useSearchBusinesses } from '../../src/lib/api/hooks';
import type { SearchParams } from '../../src/lib/api/types';
import { toApiCountry } from '../../src/lib/country';

type MainCategory =
  | 'friseur'
  | 'naegel'
  | 'haarentfernung'
  | 'kosmetik'
  | 'massage'
  | 'maenner'
  | 'frauen';

type CategoryConfig = {
  label: string;
  allLabel: string;
  sub: string[];
};

const CATEGORY_MAP: Record<MainCategory, CategoryConfig> = {
  friseur: {
    label: 'Friseur',
    allLabel: 'Alle Friseur Behandlungen',
    sub: [
      'Damenhaarschnitt',
      'Damen - Farbe, Toenung & Straehnen',
      'Herrenhaarschnitt',
      'Styling und Foehnen',
      'Balayage',
      'Kinderhaarschnitt'
    ]
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
    sub: [
      'Gesichtsbehandlungen',
      'Wimpernverlaengerung',
      'Augenbrauen und Wimpern faerben',
      'Augenbrauen zupfen',
      'Wimpernwelle',
      'Microdermabrasion'
    ]
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

export default function HomePage() {
  const { locale } = useParams<{ locale: string }>();
  const country = useCountry();
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
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

  const mapCenter = useMemo(() => {
    if (gps) {
      return gps;
    }
    const firstWithGeo = (data ?? []).find((item) => typeof item.lat === 'number' && typeof item.lng === 'number');
    if (firstWithGeo && typeof firstWithGeo.lat === 'number' && typeof firstWithGeo.lng === 'number') {
      return { lat: firstWithGeo.lat, lng: firstWithGeo.lng };
    }
    return { lat: 52.52, lng: 13.405 };
  }, [data, gps]);

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

  function onSearch() {
    if (!subCategory) {
      setServiceError('Bitte zuerst eine konkrete Behandlung auswaehlen.');
      return;
    }
    setServiceError('');

    const hasTextLocation = city.trim() || postalCode.trim();
    if (!hasTextLocation && !gps) {
      setLocationError('Bitte Stadt/PLZ eingeben oder GPS-Standort erlauben.');
      return;
    }
    setLocationError('');

    const cityText = city.trim();
    const postalCodeText = postalCode.trim();

    const search = new URLSearchParams();
    search.set('country', toApiCountry(country));
    search.set('category', mainCategory);
    const fullQuery = [subCategory, cityText, postalCodeText].filter(Boolean).join(' ');
    if (fullQuery) {
      search.set('q', fullQuery);
    }
    if (cityText) {
      search.set('city', cityText);
    }
    if (postalCodeText) {
      search.set('postalCode', postalCodeText);
    }
    if (gps) {
      search.set('lat', gps.lat.toString());
      search.set('lng', gps.lng.toString());
      search.set('radiusKm', '8');
    }
    if (radiusKm) {
      search.set('radiusKm', radiusKm);
    }
    if (ratingMin) {
      search.set('ratingMin', ratingMin);
    }
    if (priceMin) {
      search.set('priceMin', priceMin);
    }
    if (priceMax) {
      search.set('priceMax', priceMax);
    }

    const params: SearchParams = {
      country: toApiCountry(country),
      category: mainCategory,
      q: search.get('q') ?? undefined,
      city: cityText,
      postalCode: postalCodeText,
      lat: gps?.lat,
      lng: gps?.lng,
      radiusKm: Number(search.get('radiusKm') ?? undefined),
      ratingMin: Number(search.get('ratingMin') ?? undefined),
      priceMin: Number(search.get('priceMin') ?? undefined),
      priceMax: Number(search.get('priceMax') ?? undefined)
    };

    if (!search.get('radiusKm')) {
      delete params.radiusKm;
    }
    if (!search.get('ratingMin')) {
      delete params.ratingMin;
    }
    if (!search.get('priceMin')) {
      delete params.priceMin;
    }
    if (!search.get('priceMax')) {
      delete params.priceMax;
    }

    setSubmittedFilters(params);
  }

  function requestGpsLocation() {
    if (gpsRequested || !navigator.geolocation) {
      if (!navigator.geolocation) {
        setGpsStatus('GPS wird von diesem Geraet/Browser nicht unterstuetzt.');
      }
      return;
    }

    setGpsRequested(true);
    setGpsStatus('Standort wird abgefragt ...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextGps = {
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6))
        };
        setGps(nextGps);
        setLocationError('');
        setGpsStatus('GPS-Standort aktiv.');
      },
      () => {
        setGpsStatus('Standortzugriff abgelehnt. Bitte Stadt/PLZ manuell eingeben.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 120000 }
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-3xl bg-gradient-to-br from-brand-700 to-brand-500 p-5 text-white">
        <h1 className="text-2xl font-semibold leading-tight">Book local services in minutes</h1>
        <p className="mt-2 text-sm text-blue-100">Germany-first booking platform for beauty, wellness and more.</p>
      </section>

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
            Klicke auf eine Kategorie, um Unterkategorien zu sehen.
          </p>
        )}
      </section>

      <section className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <label className="grid gap-1 text-sm text-slate-600">
          Stadt
          <input
            className="rounded-xl border p-3"
            placeholder="z. B. Berlin (oder tippen fuer GPS)"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onFocus={requestGpsLocation}
            onClick={requestGpsLocation}
          />
        </label>
        <label className="grid gap-1 text-sm text-slate-600">
          PLZ
          <input
            className="rounded-xl border p-3"
            placeholder="z. B. 10115"
            inputMode="numeric"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            className="rounded-xl border p-3"
            type="number"
            min="1"
            placeholder="Distanz (km)"
            value={radiusKm}
            onChange={(e) => setRadiusKm(e.target.value)}
          />
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
          <input
            className="rounded-xl border p-3"
            type="number"
            min="0"
            placeholder="Preis min"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
          />
          <input
            className="rounded-xl border p-3"
            type="number"
            min="0"
            placeholder="Preis max"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
          />
        </div>
        <button type="button" className="rounded-xl bg-brand-500 p-3 font-medium text-white" onClick={onSearch}>
          Jetzt suchen
        </button>
        {serviceError ? <p className="text-xs text-rose-600">{serviceError}</p> : null}
        {gpsStatus ? <p className="text-xs text-slate-600">{gpsStatus}</p> : null}
        {locationError ? <p className="text-xs text-rose-600">{locationError}</p> : null}
      </section>

      {submittedFilters ? (
        <section className="space-y-3">
          <LiveMap lat={mapCenter.lat} lng={mapCenter.lng} />
          <div className="space-y-3">
            {isLoading ? <p className="text-sm text-slate-600">Suche laeuft ...</p> : null}
            {!isLoading && (!data || data.length === 0) ? (
              <p className="text-sm text-slate-600">Keine Ergebnisse mit den aktuellen Filtern.</p>
            ) : null}
            {(data ?? []).map((business) => (
              <BusinessCard key={business._id} locale={locale} business={business} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
