import { headers } from 'next/headers';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { BottomNav } from '../../src/components/BottomNav';
import { CountrySwitcher } from '../../src/components/CountrySwitcher';
import { InstallPrompt } from '../../src/components/InstallPrompt';
import { LanguageSwitcher } from '../../src/components/LanguageSwitcher';
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
  await headers();

  return (
    <QueryProvider>
      <div className="mx-auto min-h-screen max-w-md bg-slate-50">
        <header className="sticky top-0 z-10 border-b bg-white/90 px-4 py-3 backdrop-blur">
          <div className="flex items-center justify-between gap-2">
            <Link href={`/${resolvedLocale}`} className="text-xl font-bold text-brand-700">
              Zervia
            </Link>
            <div className="flex items-center gap-1">
              <Link
                href={`/${resolvedLocale}/auth/login?role=customer`}
                className="flex items-center gap-1 rounded-lg border px-2 py-1 text-xs text-slate-700"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="8" r="3.5" />
                  <path d="M5 20c1.8-3 4-4.5 7-4.5s5.2 1.5 7 4.5" />
                </svg>
                Customer
              </Link>
              <Link
                href={`/${resolvedLocale}/auth/login?role=business`}
                className="rounded-lg border px-2 py-1 text-xs text-slate-700"
              >
                <span className="inline-flex items-center gap-1">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M4 19h16M6 19V8l6-3 6 3v11M10 12h4M10 15h4" />
                  </svg>
                  Business
                </span>
              </Link>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <label className="grid gap-1 text-[11px] text-slate-500">
              Country
              <CountrySwitcher />
            </label>
            <label className="grid gap-1 text-[11px] text-slate-500">
              Language
              <LanguageSwitcher locale={resolvedLocale} />
            </label>
          </div>
        </header>
        <main className="px-4 py-4">{children}</main>
        <InstallPrompt />
        <BottomNav locale={resolvedLocale} />
      </div>
    </QueryProvider>
  );
}
