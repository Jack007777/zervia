import Link from 'next/link';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';

import { InstallPrompt } from '../../src/components/InstallPrompt';
import { resolveLocale } from '../../src/i18n/config';
import deMessages from '../../src/i18n/messages/de.json';
import enMessages from '../../src/i18n/messages/en.json';
import { QueryProvider } from '../../src/providers/query-provider';

export const runtime = 'edge';

async function getMessages(locale: string) {
  const resolved = resolveLocale(locale);
  if (resolved === 'de') {
    return deMessages;
  }
  return enMessages;
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolvedLocale = resolveLocale(locale);
  const messages = await getMessages(resolvedLocale);

  return (
    <NextIntlClientProvider locale={resolvedLocale} messages={messages}>
      <QueryProvider>
        <div className="mx-auto min-h-screen max-w-md bg-slate-50">
          <header className="sticky top-0 z-10 border-b bg-white/90 px-4 py-3 backdrop-blur">
            <Link href={`/${resolvedLocale}`} className="text-xl font-bold text-brand-700">
              Zervia
            </Link>
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
    </NextIntlClientProvider>
  );
}
