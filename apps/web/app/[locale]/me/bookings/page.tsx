'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';

import { AuthGuard } from '../../../../src/components/AuthGuard';
import { useCountry } from '../../../../src/hooks/useCountry';
import { useAuthMe, useMyBookings, useSendPhoneCode, useVerifyPhoneCode } from '../../../../src/lib/api/hooks';
import { toApiCountry } from '../../../../src/lib/country';

export default function MyBookingsPage() {
  const { locale } = useParams<{ locale: string }>();
  const country = useCountry();
  const { data, isLoading } = useMyBookings(toApiCountry(country));
  const meQuery = useAuthMe();
  const sendCode = useSendPhoneCode();
  const verifyCode = useVerifyPhoneCode();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');

  return (
    <AuthGuard locale={locale}>
      <div className="space-y-3">
        <h1 className="text-xl font-semibold">My bookings</h1>
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-2 font-medium">Phone verification</h2>
          <p className="mb-2 text-sm text-slate-600">
            Status: {meQuery.data?.phoneVerified ? 'Verified' : 'Not verified'}
          </p>
          <div className="grid gap-2">
            <input
              className="rounded-xl border p-2"
              placeholder="+49..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <button
              type="button"
              className="rounded-xl border p-2"
              onClick={async () => {
                try {
                  await sendCode.mutateAsync({ phone: phone.trim() || undefined });
                  setMessage('Verification code sent via SMS.');
                  await meQuery.refetch();
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : 'Failed to send code');
                }
              }}
            >
              Send SMS code
            </button>
            <input
              className="rounded-xl border p-2"
              placeholder="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button
              type="button"
              className="rounded-xl bg-brand-500 p-2 text-white"
              onClick={async () => {
                try {
                  await verifyCode.mutateAsync({ code: code.trim() });
                  setMessage('Phone verified.');
                  setCode('');
                  await meQuery.refetch();
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : 'Verification failed');
                }
              }}
            >
              Verify code
            </button>
            {message ? <p className="text-xs text-emerald-700">{message}</p> : null}
          </div>
        </section>
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
