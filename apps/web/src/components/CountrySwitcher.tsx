'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { COUNTRY_OPTIONS, getStoredCountry, setStoredCountry, type CountryOption } from '../lib/country';

export function CountrySwitcher() {
  const pathname = usePathname();
  const query = useSearchParams();
  const router = useRouter();
  const [country, setCountry] = useState<CountryOption>('DE');

  useEffect(() => {
    const fromQuery = query.get('country');
    if (fromQuery && COUNTRY_OPTIONS.includes(fromQuery as CountryOption)) {
      setCountry(fromQuery as CountryOption);
      setStoredCountry(fromQuery as CountryOption);
      return;
    }
    setCountry(getStoredCountry());
  }, [query]);

  function onChange(next: CountryOption) {
    setCountry(next);
    setStoredCountry(next);

    const search = new URLSearchParams(query.toString());
    search.set('country', next);
    router.replace(`${pathname}?${search.toString()}` as never);
  }

  return (
    <select
      className="rounded-lg border bg-white px-2 py-1 text-xs text-slate-700"
      value={country}
      onChange={(e) => onChange(e.target.value as CountryOption)}
      aria-label="Country"
    >
      {COUNTRY_OPTIONS.map((item) => (
        <option key={item} value={item}>
          {item}
        </option>
      ))}
    </select>
  );
}
