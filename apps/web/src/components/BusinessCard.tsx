import Link from 'next/link';

import type { Business } from '../lib/api/types';
import { formatBerlinDateTime, isFutureOrNowSlot } from '../lib/time';

import { RatingStars } from './RatingStars';

type Props = {
  locale: string;
  business: Business;
};

export function BusinessCard({ locale, business }: Props) {
  const rating = business.avgRating ?? business.rating ?? 0;
  const reviewCount = business.reviewCount ?? 0;
  const hasValidEarliest = isFutureOrNowSlot(business.earliestSlot);
  if (business.earliestSlot && !hasValidEarliest) {
    // Frontend safety net: never trust/print stale past slots.
    console.error('CRITICAL: past earliest slot filtered from UI', {
      businessId: business._id,
      earliestSlot: business.earliestSlot,
      nowIso: new Date().toISOString(),
      timezone: 'Europe/Berlin'
    });
  }
  const earliestSlot = hasValidEarliest
    ? formatBerlinDateTime(business.earliestSlot, locale === 'de' ? 'de-DE' : 'en-GB')
    : locale === 'de'
      ? 'Heute keine freien Termine'
      : 'No upcoming slots today';
  const currency = business.defaultCurrency ?? 'EUR';
  const slugOrId = business.slug ?? business._id;

  return (
    <article className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <Link
        href={`/${locale}/p/${slugOrId}`}
        className="block aspect-[16/7] w-full bg-gradient-to-br from-slate-100 to-slate-200 p-3 text-xs text-slate-500 hover:opacity-95"
        aria-label={`Open ${business.name} details`}
      >
        Image
      </Link>
      <div className="p-4">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold">{business.name}</h3>
          <div className="flex items-center gap-1">
            {business.isVirtual ? (
              <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-700">Virtual</span>
            ) : null}
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{business.category ?? '-'}</span>
          </div>
        </div>
        <p className="mb-2 line-clamp-2 text-sm text-slate-600">{business.description ?? 'No description yet.'}</p>

        <div className="mb-2 flex items-center gap-2 text-sm">
          <RatingStars rating={rating} />
          <span className="font-medium text-slate-800">{rating.toFixed(1)}</span>
          <span className="text-slate-500">({reviewCount})</span>
        </div>

        <div className="mb-3 grid grid-cols-2 gap-2 text-xs text-slate-700">
          <span>
            {currency} {business.priceMin ?? '--'}+
          </span>
          <span>{business.distanceKm ? `${business.distanceKm.toFixed(1)} km` : business.area ?? business.city ?? '-'}</span>
          <span className="col-span-2 rounded-md bg-emerald-50 px-2 py-1 text-emerald-700">
            {locale === 'de' ? 'Frühester Termin:' : 'Earliest:'} {earliestSlot}
          </span>
        </div>

        {business.tags?.length ? (
          <div className="mb-3 flex flex-wrap gap-1">
            {business.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full border px-2 py-0.5 text-[11px] text-slate-600">
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <div className="flex gap-2">
          <Link className="rounded-xl border px-3 py-2 text-sm" href={`/${locale}/p/${slugOrId}`}>
            Details
          </Link>
          <Link className="rounded-xl bg-brand-500 px-3 py-2 text-sm text-white" href={`/${locale}/b/${business._id}/book`}>
            Book
          </Link>
        </div>
      </div>
    </article>
  );
}
