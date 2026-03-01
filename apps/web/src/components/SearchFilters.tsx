'use client';

import { useState } from 'react';

import type { SearchParams } from '../lib/api/types';

type Props = {
  initial?: SearchParams;
  onChange: (params: SearchParams) => void;
};

export function SearchFilters({ initial, onChange }: Props) {
  const [state, setState] = useState<SearchParams>(initial ?? { country: 'DE' });

  function update(next: SearchParams) {
    setState(next);
    onChange(next);
  }

  return (
    <section className="grid grid-cols-2 gap-2 rounded-2xl bg-white p-3 shadow-sm">
      <input
        className="col-span-2 rounded-xl border p-2"
        placeholder="Category"
        value={state.category ?? ''}
        onChange={(e) => update({ ...state, category: e.target.value })}
      />
      <input
        className="rounded-xl border p-2"
        type="number"
        placeholder="Distance km"
        value={state.radiusKm ?? ''}
        onChange={(e) =>
          update({ ...state, radiusKm: e.target.value ? Number(e.target.value) : undefined })
        }
      />
      <input
        className="rounded-xl border p-2"
        type="number"
        placeholder="Min rating"
        value={state.ratingMin ?? ''}
        onChange={(e) =>
          update({ ...state, ratingMin: e.target.value ? Number(e.target.value) : undefined })
        }
      />
      <input
        className="rounded-xl border p-2"
        type="number"
        placeholder="Price min"
        value={state.priceMin ?? ''}
        onChange={(e) =>
          update({ ...state, priceMin: e.target.value ? Number(e.target.value) : undefined })
        }
      />
      <input
        className="rounded-xl border p-2"
        type="number"
        placeholder="Price max"
        value={state.priceMax ?? ''}
        onChange={(e) =>
          update({ ...state, priceMax: e.target.value ? Number(e.target.value) : undefined })
        }
      />
    </section>
  );
}
