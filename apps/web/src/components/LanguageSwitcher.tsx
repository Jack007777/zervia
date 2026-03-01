'use client';

import { usePathname, useRouter } from 'next/navigation';

type Props = {
  locale: 'de' | 'en';
};

const SUPPORTED_LOCALES = new Set(['de', 'en']);

export function LanguageSwitcher({ locale }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  function onChange(nextLocale: string) {
    if (!SUPPORTED_LOCALES.has(nextLocale)) {
      return;
    }

    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) {
      router.push(`/${nextLocale}` as never);
      return;
    }

    if (SUPPORTED_LOCALES.has(segments[0])) {
      segments[0] = nextLocale;
      router.push(`/${segments.join('/')}` as never);
      return;
    }

    router.push(`/${nextLocale}/${segments.join('/')}` as never);
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
