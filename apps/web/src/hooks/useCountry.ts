'use client';

import { useEffect, useState } from 'react';

import { getStoredCountry, type CountryOption } from '../lib/country';

export function useCountry() {
  const [country, setCountry] = useState<CountryOption>('DE');

  useEffect(() => {
    setCountry(getStoredCountry());

    const onChange = (event: Event) => {
      const custom = event as CustomEvent<CountryOption>;
      if (custom.detail) {
        setCountry(custom.detail);
      } else {
        setCountry(getStoredCountry());
      }
    };

    window.addEventListener('zervia-country-changed', onChange);
    return () => window.removeEventListener('zervia-country-changed', onChange);
  }, []);

  return country;
}

