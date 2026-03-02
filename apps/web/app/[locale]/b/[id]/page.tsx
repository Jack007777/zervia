'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';

import { RatingStars } from '../../../../src/components/RatingStars';
import { useBusiness, useBusinessServices } from '../../../../src/lib/api/hooks';
import type { Review, Service } from '../../../../src/lib/api/types';
import { getMockBusinessById } from '../../../../src/lib/mock-marketplace';

function ReviewsSection({ reviews }: { reviews: Review[] }) {
  const [sort, setSort] = useState<'latest' | 'highest'>('latest');
  const [page, setPage] = useState(1);
  const pageSize = 4;

  const sorted = useMemo(() => {
    const list = [...reviews];
    if (sort === 'highest') {
      return list.sort((a, b) => b.rating - a.rating);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [reviews, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = sorted.slice((page - 1) * pageSize, page * pageSize);

  return (
    <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Reviews</h2>
        <select className="rounded-lg border px-2 py-1 text-xs" value={sort} onChange={(e) => setSort(e.target.value as 'latest' | 'highest')}>
          <option value="latest">Latest</option>
          <option value="highest">Highest rating</option>
        </select>
      </div>

      {paged.length === 0 ? <p className="text-sm text-slate-600">No reviews yet.</p> : null}

      {paged.map((review) => (
        <article key={review._id} className="rounded-xl border p-3">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-sm font-medium">{review.author}</p>
            <RatingStars rating={review.rating} />
          </div>
          <p className="text-sm text-slate-700">{review.text}</p>
          <p className="mt-1 text-xs text-slate-500">{new Date(review.createdAt).toLocaleDateString()}</p>
        </article>
      ))}

      {sorted.length > pageSize ? (
        <div className="flex items-center justify-between text-sm">
          <button className="rounded-lg border px-2 py-1 disabled:opacity-40" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Prev
          </button>
          <span>
            {page}/{totalPages}
          </span>
          <button className="rounded-lg border px-2 py-1 disabled:opacity-40" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
            Next
          </button>
        </div>
      ) : null}
    </section>
  );
}

function ServiceList({ services }: { services: Service[] }) {
  return (
    <section className="space-y-2 rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="font-medium">Services</h2>
      {services.map((service) => (
        <div key={service._id} className="flex items-center justify-between rounded-xl border p-3">
          <div>
            <p className="font-medium">{service.name}</p>
            <p className="text-sm text-slate-600">{service.durationMinutes} min</p>
          </div>
          <p className="text-sm font-medium">
            {service.currency} {service.price}
          </p>
        </div>
      ))}
    </section>
  );
}

export default function BusinessDetailPage() {
  const { locale, id } = useParams<{ locale: string; id: string }>();
  const { data: apiBusiness } = useBusiness(id);
  const { data: apiServices, isLoading } = useBusinessServices(id);

  const mockBusiness = getMockBusinessById(id);
  const business = apiBusiness ?? mockBusiness;
  const services = (apiServices && apiServices.length ? apiServices : mockBusiness?.services) ?? [];
  const reviews = mockBusiness?.reviews ?? [];

  const schema = useMemo(() => {
    if (!business) {
      return null;
    }

    return {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: business.name,
      description: business.description,
      address: { '@type': 'PostalAddress', streetAddress: business.addressLine, addressLocality: business.city, addressCountry: business.country ?? 'DE' },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: business.avgRating ?? business.rating ?? 0,
        reviewCount: business.reviewCount ?? reviews.length
      }
    };
  }, [business, reviews.length]);

  const rating = business?.avgRating ?? business?.rating ?? 0;

  return (
    <div className="space-y-4">
      {schema ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} /> : null}

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">{business?.name ?? 'Business'}</h1>
          {business?.isVirtual ? (
            <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-700">
              Virtual listing
            </span>
          ) : null}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <RatingStars rating={rating} size="md" />
          <span className="font-medium">{rating.toFixed(1)}</span>
          <span className="text-sm text-slate-500">({business?.reviewCount ?? reviews.length})</span>
        </div>
        <p className="mt-2 text-sm text-slate-600">{business?.description ?? 'No description.'}</p>
        <p className="mt-3 text-sm text-slate-700">{business?.addressLine ?? 'Address pending'}</p>
        <a
          className="mt-1 inline-block text-sm text-brand-700 underline"
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business?.addressLine ?? '')}`}
          target="_blank"
          rel="noreferrer"
        >
          Open map
        </a>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-medium">Opening hours</h2>
        <ul className="mt-2 space-y-1 text-sm text-slate-700">
          {(business?.openingHours ?? []).map((row) => (
            <li key={row.day} className="flex justify-between">
              <span>{row.day}</span>
              <span>{row.closed ? 'Closed' : `${row.open} - ${row.close}`}</span>
            </li>
          ))}
        </ul>
      </section>

      <ServiceList services={services} />

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-medium">Cancellation policy</h2>
        <p className="mt-2 text-sm text-slate-700">{business?.cancellationPolicy ?? 'Free cancellation up to 24h before appointment.'}</p>
      </section>

      <ReviewsSection reviews={reviews} />

      {isLoading ? <p className="text-sm text-slate-600">Loading...</p> : null}

      <Link href={`/${locale}/b/${id}/book`} className="block rounded-xl bg-brand-500 p-3 text-center font-medium text-white">
        Book now
      </Link>
    </div>
  );
}
