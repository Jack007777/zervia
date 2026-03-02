'use client';

import { useState } from 'react';

import type { SearchParams } from '../lib/api/types';
import { uiCopy } from '../lib/ui-copy';

type Props = {
  initial?: SearchParams;
  locale?: 'de' | 'en';
  onChange: (params: SearchParams) => void;
};

export function SearchFilters({ initial, locale = 'en', onChange }: Props) {
  const [state, setState] = useState<SearchParams>(initial ?? { country: 'DE', sort: 'recommended', page: 1, limit: 10 });

  function update(next: SearchParams) {
    const patched = { ...next, page: next.page ?? 1, limit: next.limit ?? 10 };
    setState(patched);
    onChange(patched);
  }

  return (
    <section className="space-y-2 rounded-2xl bg-white p-3 shadow-sm">
      <label className="grid gap-1 text-xs text-slate-500">
        {uiCopy[locale].sortLabel}
        <select
          className="rounded-xl border p-2"
          value={state.sort ?? 'recommended'}
          onChange={(e) => update({ ...state, sort: e.target.value as SearchParams['sort'] })}
        >
          <option value="recommended">Recommended</option>
          <option value="distance">Distance</option>
          <option value="price">Price</option>
          <option value="rating">Rating</option>
        </select>
      </label>

      <div className="grid grid-cols-2 gap-2">
        <input
          className="col-span-2 rounded-xl border p-2"
          type="date"
          value={state.date ?? ''}
          onChange={(e) => update({ ...state, date: e.target.value || undefined })}
        />
        <select
          className="rounded-xl border p-2"
          value={state.availableTime ?? ''}
          onChange={(e) =>
            update({ ...state, availableTime: (e.target.value || undefined) as SearchParams['availableTime'] })
          }
        >
          <option value="">Any time</option>
          <option value="morning">Morning</option>
          <option value="afternoon">Afternoon</option>
          <option value="evening">Evening</option>
        </select>
        <select
          className="rounded-xl border p-2"
          value={state.serviceFor ?? 'all'}
          onChange={(e) => update({ ...state, serviceFor: e.target.value as SearchParams['serviceFor'] })}
        >
          <option value="all">All genders</option>
          <option value="women">For women</option>
          <option value="men">For men</option>
        </select>
        <input
          className="rounded-xl border p-2"
          type="number"
          placeholder="Distance km"
          value={state.radiusKm ?? ''}
          onChange={(e) => update({ ...state, radiusKm: e.target.value ? Number(e.target.value) : undefined })}
        />
        <input
          className="rounded-xl border p-2"
          type="number"
          min="1"
          max="5"
          step="0.1"
          placeholder="Min rating"
          value={state.ratingMin ?? ''}
          onChange={(e) => update({ ...state, ratingMin: e.target.value ? Number(e.target.value) : undefined })}
        />
        <input
          className="rounded-xl border p-2"
          type="number"
          placeholder="Price min"
          value={state.priceMin ?? ''}
          onChange={(e) => update({ ...state, priceMin: e.target.value ? Number(e.target.value) : undefined })}
        />
        <input
          className="rounded-xl border p-2"
          type="number"
          placeholder="Price max"
          value={state.priceMax ?? ''}
          onChange={(e) => update({ ...state, priceMax: e.target.value ? Number(e.target.value) : undefined })}
        />
      </div>
    </section>
  );
}
