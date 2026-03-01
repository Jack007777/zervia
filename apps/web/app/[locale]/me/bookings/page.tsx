'use client';

import { use } from 'react';

import { AuthGuard } from '../../../../src/components/AuthGuard';
import { useMyBookings } from '../../../../src/lib/api/hooks';

export default function MyBookingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const { data, isLoading } = useMyBookings();

  return (
    <AuthGuard locale={locale}>
      <div className="space-y-3">
        <h1 className="text-xl font-semibold">My bookings</h1>
        {isLoading ? <p className="text-sm text-slate-600">Loading...</p> : null}
        {(data ?? []).map((booking) => (
          <article key={booking._id} className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="font-medium">Business: {booking.businessId}</p>
            <p className="text-sm text-slate-600">Service: {booking.serviceId}</p>
            <p className="text-sm text-slate-600">Start: {booking.startTime}</p>
            <p className="text-sm text-slate-600">Status: {booking.status}</p>
          </article>
        ))}
      </div>
    </AuthGuard>
  );
}
