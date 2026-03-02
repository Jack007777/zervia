import { headers } from 'next/headers';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { BottomNav } from '../../src/components/BottomNav';
import { CountrySwitcher } from '../../src/components/CountrySwitcher';
import { InstallPrompt } from '../../src/components/InstallPrompt';
import { LanguageSwitcher } from '../../src/components/LanguageSwitcher';
import { LoginEntry } from '../../src/components/LoginEntry';
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
            <Link href={`/${resolvedLocale}`} className="flex items-center gap-2 text-xl font-bold text-brand-700">
              <img
                src="/zervia-logo.svg"
                alt="Zervia logo"
                className="h-8 w-8 rounded-md border border-slate-200 bg-white object-contain p-0.5"
              />
              <span>Zervia</span>
            </Link>
            <LoginEntry locale={resolvedLocale} />
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
