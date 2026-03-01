'use client';

import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export default function HomePage() {
  const { locale } = useParams<{ locale: string }>();
  const [city, setCity] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('beauty');
  const t = useTranslations('home');
  const router = useRouter();

  function onSearch() {
    const search = new URLSearchParams();
    if (query) {
      search.set('q', query);
    }
    if (city) {
      search.set('q', `${query} ${city}`.trim());
    }
    if (category) {
      search.set('category', category);
    }
    router.push(`/${locale}/search?${search.toString()}`);
  }

  return (
    <div className="space-y-4">
      <section className="rounded-3xl bg-gradient-to-br from-brand-700 to-brand-500 p-5 text-white">
        <h1 className="text-2xl font-semibold leading-tight">{t('title')}</h1>
        <p className="mt-2 text-sm text-blue-100">{t('subtitle')}</p>
      </section>

      <section className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <input
          className="rounded-xl border p-3"
          placeholder={t('cityPlaceholder')}
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <div className="grid grid-cols-3 gap-2">
          {['beauty', 'wellness', 'fitness'].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`rounded-xl px-3 py-2 text-sm ${
                category === item ? 'bg-brand-500 text-white' : 'bg-slate-100'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <input
          className="rounded-xl border p-3"
          placeholder={t('searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="button" className="rounded-xl bg-brand-500 p-3 font-medium text-white" onClick={onSearch}>
          {t('searchAction')}
        </button>
      </section>
    </div>
  );
}
