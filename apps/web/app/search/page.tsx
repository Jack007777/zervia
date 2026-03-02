import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { resolveLocale } from '../../src/i18n/config';

export default async function SearchRedirectPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const headerMap = await headers();
  const acceptLanguage = headerMap.get('accept-language') ?? 'en';
  const locale = resolveLocale(acceptLanguage.toLowerCase().startsWith('de') ? 'de' : 'en');
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(sp)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        search.append(key, item);
      }
      continue;
    }
    if (typeof value === 'string') {
      search.set(key, value);
    }
  }

  redirect(`/${locale}/search${search.toString() ? `?${search.toString()}` : ''}` as never);
}
