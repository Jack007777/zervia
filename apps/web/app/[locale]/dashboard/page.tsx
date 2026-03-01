'use client';

import { useParams } from 'next/navigation';

import { AuthGuard } from '../../../src/components/AuthGuard';

export default function DashboardPage() {
  const { locale } = useParams<{ locale: string }>();
  return (
    <AuthGuard locale={locale}>
      <div className="space-y-3">
        <h1 className="text-xl font-semibold">Business dashboard</h1>
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="font-medium">Store profile</h2>
          <p className="text-sm text-slate-600">Name, address, opening times</p>
        </section>
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="font-medium">Service management</h2>
          <p className="text-sm text-slate-600">Add/edit/remove services</p>
        </section>
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="font-medium">Upcoming bookings</h2>
          <p className="text-sm text-slate-600">Booking list placeholder</p>
        </section>
      </div>
    </AuthGuard>
  );
}
