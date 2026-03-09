'use client';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { useVerifyEmailRegister } from '../../../../src/lib/api/hooks';

export default function VerifyEmailPage() {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const verifyMutation = useVerifyEmailRegister();
  const hasStartedRef = useRef(false);
  const [statusMessage, setStatusMessage] = useState('Checking your verification link...');

  useEffect(() => {
    const email = searchParams.get('email')?.trim() ?? '';
    const code = searchParams.get('code')?.trim() ?? '';

    if (!email || !code) {
      setStatusMessage('This verification link is incomplete or invalid.');
      return;
    }

    if (hasStartedRef.current) {
      return;
    }
    hasStartedRef.current = true;

    void verifyMutation
      .mutateAsync({ email, code })
      .then(() => {
        setStatusMessage('Your email is verified. Redirecting...');
        window.setTimeout(() => {
          router.replace(`/${locale}/search`);
        }, 1200);
      })
      .catch((error) => {
        setStatusMessage(error instanceof Error ? error.message : 'Email verification failed.');
      });
  }, [locale, router, searchParams, verifyMutation]);

  return (
    <main className="mx-auto max-w-md space-y-4 py-10">
      <section className="grid gap-3 rounded-2xl bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-semibold">Verify email</h1>
        <p className="text-sm text-slate-600">{statusMessage}</p>
        {verifyMutation.isPending ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <span>Verifying...</span>
          </div>
        ) : null}
        {verifyMutation.isError ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            The link may be expired or already used. You can go back and request a fresh email.
          </p>
        ) : null}
      </section>
      <Link href={`/${locale}/auth/register`} className="text-sm text-brand-700">
        Back to register
      </Link>
    </main>
  );
}
