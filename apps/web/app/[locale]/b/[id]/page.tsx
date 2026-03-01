'use client';

import Link from 'next/link';
import { use } from 'react';

import { useBusiness, useBusinessServices } from '../../../../src/lib/api/hooks';

export default function BusinessDetailPage({
  params
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = use(params);
  const { data: business } = useBusiness(id);
  const { data: services, isLoading } = useBusinessServices(id);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h1 className="text-xl font-semibold">{business?.name ?? 'Business'}</h1>
        <p className="mt-2 text-sm text-slate-600">{business?.description ?? 'No description.'}</p>
        <p className="mt-3 text-sm text-slate-700">{business?.addressLine ?? 'Address pending'}</p>
        <p className="mt-1 text-sm text-slate-500">Opening hours: placeholder</p>
        <p className="mt-1 text-sm text-slate-500">Reviews: placeholder</p>
      </section>

      <section className="space-y-2 rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-medium">Services</h2>
        {isLoading ? <p className="text-sm text-slate-600">Loading...</p> : null}
        {(services ?? []).map((service) => (
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
        <Link href={`/${locale}/b/${id}/book`} className="block rounded-xl bg-brand-500 p-3 text-center font-medium text-white">
          Book now
        </Link>
      </section>
    </div>
  );
}
