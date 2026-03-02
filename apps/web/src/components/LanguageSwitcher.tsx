'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type Props = {
  locale: 'de' | 'en';
};

const SUPPORTED_LOCALES = new Set(['de', 'en']);

export function LanguageSwitcher({ locale }: Props) {
  const pathname = usePathname();
  const query = useSearchParams();
  const router = useRouter();
  const querySuffix = query.toString() ? `?${query.toString()}` : '';

  function onChange(nextLocale: string) {
    if (!SUPPORTED_LOCALES.has(nextLocale)) {
      return;
    }

    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) {
      router.push(`/${nextLocale}${querySuffix}` as never);
      return;
    }

    if (SUPPORTED_LOCALES.has(segments[0])) {
      segments[0] = nextLocale;
      router.push(`/${segments.join('/')}${querySuffix}` as never);
      return;
    }

    router.push(`/${nextLocale}/${segments.join('/')}${querySuffix}` as never);
  }

  return (
    <select
      className="rounded-lg border bg-white px-2 py-1 text-xs text-slate-700"
      value={locale}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Language"
    >
      <option value="de">DE</option>
      <option value="en">EN</option>
    </select>
  );
}
