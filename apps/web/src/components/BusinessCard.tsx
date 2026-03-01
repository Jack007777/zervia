import Link from 'next/link';

import type { Business } from '../lib/api/types';

type Props = {
  locale: string;
  business: Business;
};

export function BusinessCard({ locale, business }: Props) {
  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold">{business.name}</h3>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{business.category ?? '—'}</span>
      </div>
      <p className="mb-3 text-sm text-slate-600">{business.description ?? 'No description yet.'}</p>
      <div className="mb-3 flex gap-3 text-sm text-slate-700">
        <span>€ {business.priceMin ?? '--'}+</span>
        <span>★ {business.rating ?? '--'}</span>
      </div>
      <div className="flex gap-2">
        <Link className="rounded-xl border px-3 py-2 text-sm" href={`/${locale}/b/${business._id}`}>
          Details
        </Link>
        <Link className="rounded-xl bg-brand-500 px-3 py-2 text-sm text-white" href={`/${locale}/b/${business._id}/book`}>
          Book
        </Link>
      </div>
    </article>
  );
}
