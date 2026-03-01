'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

import { BusinessCard } from '../../../src/components/BusinessCard';
import { MapPlaceholder } from '../../../src/components/MapPlaceholder';
import { SearchFilters } from '../../../src/components/SearchFilters';
import { useCountry } from '../../../src/hooks/useCountry';
import { useSearchBusinesses } from '../../../src/lib/api/hooks';
import type { SearchParams } from '../../../src/lib/api/types';
import { toApiCountry } from '../../../src/lib/country';

export default function SearchPage() {
  const { locale } = useParams<{ locale: string }>();
  const q = useSearchParams();
  const selectedCountry = useCountry();

  const initial = useMemo<SearchParams>(
    () => ({
      q: q.get('q') ?? undefined,
      category: q.get('category') ?? undefined,
      country: toApiCountry((q.get('country') ?? selectedCountry) as string)
    }),
    [q, selectedCountry]
  );
  const [filters, setFilters] = useState<SearchParams>(initial);
  const apiFilters = useMemo(
    () => ({ ...filters, country: toApiCountry(filters.country ?? selectedCountry) }),
    [filters, selectedCountry]
  );
  const { data, isLoading } = useSearchBusinesses(apiFilters);

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">Find businesses</h1>
      <SearchFilters initial={initial} onChange={setFilters} />
      <MapPlaceholder />
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
