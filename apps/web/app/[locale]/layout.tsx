import Link from 'next/link';
import type { ReactNode } from 'react';

import { InstallPrompt } from '../../src/components/InstallPrompt';
import { resolveLocale } from '../../src/i18n/config';
import { QueryProvider } from '../../src/providers/query-provider';

export const runtime = 'edge';

export default async function LocaleLayout({
  children,
  params
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolvedLocale = resolveLocale(locale);

  return (
    <QueryProvider>
      <div className="mx-auto min-h-screen max-w-md bg-slate-50">
        <header className="sticky top-0 z-10 border-b bg-white/90 px-4 py-3 backdrop-blur">
          <div className="flex items-center justify-between">
            <Link href={`/${resolvedLocale}`} className="text-xl font-bold text-brand-700">
              Zervia
            </Link>
            <div className="flex items-center gap-1 rounded-lg border bg-white p-1 text-xs">
              <Link
                href="/de"
                className={`rounded px-2 py-1 ${resolvedLocale === 'de' ? 'bg-brand-500 text-white' : 'text-slate-600'}`}
              >
                DE
              </Link>
              <Link
                href="/en"
                className={`rounded px-2 py-1 ${resolvedLocale === 'en' ? 'bg-brand-500 text-white' : 'text-slate-600'}`}
              >
                EN
              </Link>
            </div>
          </div>
        </header>
        <main className="px-4 py-4">{children}</main>
        <InstallPrompt />
        <nav className="sticky bottom-0 grid grid-cols-4 border-t bg-white px-2 py-2 text-xs">
          <Link className="text-center" href={`/${resolvedLocale}/search`}>
            Search
          </Link>
          <Link className="text-center" href={`/${resolvedLocale}/me/bookings`}>
            Bookings
          </Link>
          <Link className="text-center" href={`/${resolvedLocale}/dashboard`}>
            Dashboard
          </Link>
          <Link className="text-center" href={`/${resolvedLocale}/auth/login`}>
            Login
          </Link>
        </nav>
      </div>
    </QueryProvider>
  );
}
