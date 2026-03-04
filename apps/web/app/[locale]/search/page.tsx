'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

import { BusinessCard } from '../../../src/components/BusinessCard';
import { LiveMap } from '../../../src/components/LiveMap';
import { SearchFilters } from '../../../src/components/SearchFilters';
import { useCountry } from '../../../src/hooks/useCountry';
import { useSearchBusinesses } from '../../../src/lib/api/hooks';
import type { Business, SearchParams } from '../../../src/lib/api/types';
import { toApiCountry } from '../../../src/lib/country';
import { getMockSearchPreview } from '../../../src/lib/mock-marketplace';
import { uiCopy } from '../../../src/lib/ui-copy';

function applySort(items: Business[], sort: SearchParams['sort']) {
  const list = [...items];
  if (sort === 'distance') {
    return list.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
  }
  if (sort === 'price') {
    return list.sort((a, b) => (a.priceMin ?? 9999) - (b.priceMin ?? 9999));
  }
  if (sort === 'rating') {
    return list.sort((a, b) => (b.avgRating ?? b.rating ?? 0) - (a.avgRating ?? a.rating ?? 0));
  }
  return list.sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0));
}

function ResultsSkeleton() {
  return (
    <div className="grid min-h-64 gap-3">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div key={idx} className="h-32 animate-pulse rounded-2xl bg-slate-200" />
      ))}
    </div>
  );
}

export default function SearchPage() {
  const { locale } = useParams<{ locale: 'de' | 'en' }>();
  const q = useSearchParams();
  const selectedCountry = useCountry();

  const city = q.get('city') ?? '';
  const zip = q.get('zip') ?? q.get('postalCode') ?? '';
  const date = q.get('date') ?? '';

  const initial = useMemo<SearchParams>(
    () => ({
      q: q.get('q') ?? undefined,
      category: q.get('category') ?? undefined,
      city: city || undefined,
      zip: zip || undefined,
      postalCode: zip || undefined,
      date: date || undefined,
      sort: (q.get('sort') as SearchParams['sort']) ?? 'recommended',
      country: toApiCountry((q.get('country') ?? selectedCountry) as string),
      lat: q.get('lat') ? Number(q.get('lat')) : undefined,
      lng: q.get('lng') ? Number(q.get('lng')) : undefined,
      radiusKm: q.get('radiusKm') ? Number(q.get('radiusKm')) : undefined,
      page: q.get('page') ? Number(q.get('page')) : 1,
      limit: 10
    }),
    [q, selectedCountry, city, zip, date]
  );

  const [filters, setFilters] = useState<SearchParams>(initial);

  const apiFilters = useMemo(
    () => ({ ...filters, country: toApiCountry(filters.country ?? selectedCountry) }),
    [filters, selectedCountry]
  );

  const { data, isLoading } = useSearchBusinesses(apiFilters);

  const mergedData = useMemo(() => {
    const hasRealSearchIntent = Boolean(
      filters.category ||
        filters.q ||
        filters.city ||
        filters.zip ||
        filters.postalCode ||
        filters.lat !== undefined ||
        filters.lng !== undefined
    );
    const base = data && data.length ? data : hasRealSearchIntent ? [] : getMockSearchPreview(12);
    const filtered = base.filter((item) => {
      if (filters.category && item.category && !String(item.category).toLowerCase().includes(filters.category.toLowerCase())) {
        return false;
      }
      if (filters.ratingMin && (item.avgRating ?? item.rating ?? 0) < filters.ratingMin) {
        return false;
      }
      if (filters.priceMin && (item.priceMin ?? 0) < filters.priceMin) {
        return false;
      }
      if (filters.priceMax && (item.priceMin ?? 0) > filters.priceMax) {
        return false;
      }
      return true;
    });

    return applySort(filtered, filters.sort);
  }, [data, filters]);

  const page = filters.page ?? 1;
  const limit = filters.limit ?? 10;
  const totalPages = Math.max(1, Math.ceil(mergedData.length / limit));
  const paginated = mergedData.slice((page - 1) * limit, page * limit);
  const activeChips = [
    filters.availableTime ? { key: 'availableTime', label: `Time: ${filters.availableTime}` } : null,
    filters.serviceFor && filters.serviceFor !== 'all' ? { key: 'serviceFor', label: `For: ${filters.serviceFor}` } : null,
    filters.sort ? { key: 'sort', label: `Sort: ${filters.sort}` } : null,
    filters.radiusKm ? { key: 'radiusKm', label: `Radius: ${filters.radiusKm} km` } : null
  ].filter(Boolean) as Array<{ key: string; label: string }>;

  const mapCenter = useMemo(() => {
    if (typeof filters.lat === 'number' && typeof filters.lng === 'number') {
      return { lat: filters.lat, lng: filters.lng };
    }
    const firstWithGeo = mergedData.find((item) => typeof item.lat === 'number' && typeof item.lng === 'number');
    if (firstWithGeo && typeof firstWithGeo.lat === 'number' && typeof firstWithGeo.lng === 'number') {
      return { lat: firstWithGeo.lat, lng: firstWithGeo.lng };
    }
    return { lat: 52.52, lng: 13.405 };
  }, [filters.lat, filters.lng, mergedData]);

  const mapMarkers = useMemo(
    () =>
      paginated
        .filter((item) => typeof item.lat === 'number' && typeof item.lng === 'number')
        .map((item) => ({
          id: item._id,
          name: item.name,
          lat: item.lat as number,
          lng: item.lng as number
        })),
    [paginated]
  );

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">{uiCopy[locale].findBusinesses}</h1>
      <p className="text-sm text-slate-600">
        {city || zip ? `${city} ${zip}`.trim() : 'Germany'} {date ? `- ${date}` : ''}
      </p>
      <section className="rounded-2xl bg-white p-3 text-sm shadow-sm">
        <p className="font-medium text-slate-900">
          {mergedData.length} results
          {filters.city ? ` · ${filters.city}` : ''}
          {filters.radiusKm ? ` · ${filters.radiusKm} km` : ''}
          {filters.sort ? ` · ${filters.sort}` : ''}
        </p>
        {activeChips.length ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {activeChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                className="rounded-full border bg-slate-50 px-2 py-1 text-xs text-slate-700"
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    [chip.key]:
                      chip.key === 'sort'
                        ? 'recommended'
                        : chip.key === 'serviceFor'
                          ? 'all'
                          : undefined,
                    page: 1
                  }))
                }
              >
                {chip.label} ×
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <SearchFilters
        locale={locale}
        initial={initial}
        onChange={(next) => {
          setFilters({ ...next, page: 1, limit });
        }}
      />

      <LiveMap lat={mapCenter.lat} lng={mapCenter.lng} markers={mapMarkers} />

      <div className="space-y-3">
        {isLoading ? <ResultsSkeleton /> : null}
        {!isLoading && paginated.length === 0 ? <p className="text-sm text-slate-600">No results found for current filters.</p> : null}
        {paginated.map((business) => (
          <BusinessCard key={business._id} locale={locale} business={business} />
        ))}
      </div>

      {mergedData.length > limit ? (
        <div className="flex items-center justify-between rounded-xl bg-white p-3 text-sm shadow-sm">
          <button
            type="button"
            className="rounded-lg border px-3 py-1 disabled:opacity-40"
            disabled={page <= 1}
            onClick={() => setFilters((prev) => ({ ...prev, page: Math.max(1, (prev.page ?? 1) - 1) }))}
          >
            Prev
          </button>
          <span>
            Page {page} / {totalPages}
          </span>
          <button
            type="button"
            className="rounded-lg border px-3 py-1 disabled:opacity-40"
            disabled={page >= totalPages}
            onClick={() => setFilters((prev) => ({ ...prev, page: Math.min(totalPages, (prev.page ?? 1) + 1) }))}
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
