'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

import { BusinessCard } from '../../../src/components/BusinessCard';
import { LiveMap } from '../../../src/components/LiveMap';
import { SearchFilters } from '../../../src/components/SearchFilters';
import { useCountry } from '../../../src/hooks/useCountry';
import { useSearchBusinesses } from '../../../src/lib/api/hooks';
import type { SearchParams } from '../../../src/lib/api/types';
import { toApiCountry } from '../../../src/lib/country';

export default function SearchPage() {
  const { locale } = useParams<{ locale: string }>();
  const q = useSearchParams();
  const selectedCountry = useCountry();
  const city = q.get('city') ?? '';
  const postalCode = q.get('postalCode') ?? '';
  const combinedLocation = [city, postalCode].filter(Boolean).join(' ');

  const initial = useMemo<SearchParams>(
    () => ({
      q: q.get('q') ?? (combinedLocation || undefined),
      category: q.get('category') ?? undefined,
      country: toApiCountry((q.get('country') ?? selectedCountry) as string),
      lat: q.get('lat') ? Number(q.get('lat')) : undefined,
      lng: q.get('lng') ? Number(q.get('lng')) : undefined,
      radiusKm: q.get('radiusKm') ? Number(q.get('radiusKm')) : undefined
    }),
    [q, selectedCountry, combinedLocation]
  );
  const [filters, setFilters] = useState<SearchParams>(initial);
  const apiFilters = useMemo(
    () => ({ ...filters, country: toApiCountry(filters.country ?? selectedCountry) }),
    [filters, selectedCountry]
  );
  const { data, isLoading } = useSearchBusinesses(apiFilters);
  const mapCenter = useMemo(() => {
    if (typeof filters.lat === 'number' && typeof filters.lng === 'number') {
      return { lat: filters.lat, lng: filters.lng };
    }
    const firstWithGeo = (data ?? []).find((item) => typeof item.lat === 'number' && typeof item.lng === 'number');
    if (firstWithGeo && typeof firstWithGeo.lat === 'number' && typeof firstWithGeo.lng === 'number') {
      return { lat: firstWithGeo.lat, lng: firstWithGeo.lng };
    }
    return { lat: 52.52, lng: 13.405 };
  }, [filters.lat, filters.lng, data]);

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">Find businesses</h1>
      {combinedLocation ? <p className="text-sm text-slate-600">Region: {combinedLocation}</p> : null}
      <SearchFilters initial={initial} onChange={setFilters} />
      <LiveMap lat={mapCenter.lat} lng={mapCenter.lng} />
      <div className="space-y-3">
        {isLoading ? <p className="text-sm text-slate-600">Loading...</p> : null}
        {!isLoading && (!data || data.length === 0) ? (
          <p className="text-sm text-slate-600">No results found for current filters.</p>
        ) : null}
        {(data ?? []).map((business) => (
          <BusinessCard key={business._id} locale={locale} business={business} />
        ))}
      </div>
    </div>
  );
}
