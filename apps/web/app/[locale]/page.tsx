'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { CategoryIcon } from '../../src/components/CategoryIcon';

type MainCategory =
  | 'friseur'
  | 'naegel'
  | 'haarentfernung'
  | 'kosmetik'
  | 'massage'
  | 'maenner'
  | 'frauen';

type CategoryConfig = {
  label: string;
  allLabel: string;
  sub: string[];
};

const CATEGORY_MAP: Record<MainCategory, CategoryConfig> = {
  friseur: {
    label: 'Friseur',
    allLabel: 'Alle Friseur Behandlungen',
    sub: [
      'Damenhaarschnitt',
      'Damen - Farbe, Toenung & Straehnen',
      'Herrenhaarschnitt',
      'Styling und Foehnen',
      'Balayage',
      'Kinderhaarschnitt'
    ]
  },
  naegel: {
    label: 'Naegel',
    allLabel: 'Alle Nagelbehandlungen',
    sub: ['Pedikuere', 'Manikuere', 'Nagel Design', 'Gel Manikuere', 'Naegel auffuellen', 'Nagelmodellage']
  },
  haarentfernung: {
    label: 'Haarentfernung',
    allLabel: 'Alle Haarentfernungen',
    sub: ['Waxing Damen', 'Brazilian Waxing', 'Sugaring', 'Waxing Herren', 'IPL - Dauerhafte Haarentfernung', 'Waxing Beine']
  },
  kosmetik: {
    label: 'Kosmetik',
    allLabel: 'Alle Kosmetik Behandlungen',
    sub: [
      'Gesichtsbehandlungen',
      'Wimpernverlaengerung',
      'Augenbrauen und Wimpern faerben',
      'Augenbrauen zupfen',
      'Wimpernwelle',
      'Microdermabrasion'
    ]
  },
  massage: {
    label: 'Massage',
    allLabel: 'Alle Massagen',
    sub: ['Entspannungsmassage', 'Thai Massage', 'Aromaoel Massage', 'Therapeutische Massage', 'Fussmassage', 'Sportmassage']
  },
  maenner: {
    label: 'Maenner',
    allLabel: 'Alle Maenner Behandlungen',
    sub: ['Maennerhaarschnitte', 'Herren - Farbe', 'Bart trimmen & Rasur', 'Gesichtsbehandlungen fuer Maenner', 'Barbershop']
  },
  frauen: {
    label: 'Frauen',
    allLabel: 'Alle Frauen Behandlungen',
    sub: ['Damenhaarschnitt', 'Damen Waxing', 'Damen Massage', 'Gesichtsbehandlungen', 'Manikuere', 'Pedikuere']
  }
};

export default function HomePage() {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const [city, setCity] = useState('');
  const [query, setQuery] = useState('');
  const [mainCategory, setMainCategory] = useState<MainCategory>('massage');
  const [subCategory, setSubCategory] = useState<string>('Entspannungsmassage');
  const [subMenuOpen, setSubMenuOpen] = useState(false);

  const current = useMemo(() => CATEGORY_MAP[mainCategory], [mainCategory]);

  function onSelectMain(next: MainCategory) {
    if (next === mainCategory) {
      setSubMenuOpen((prev) => !prev);
      return;
    }
    setMainCategory(next);
    setSubCategory(CATEGORY_MAP[next].sub[0]);
    setSubMenuOpen(true);
  }

  function onSearch() {
    const search = new URLSearchParams();
    search.set('category', mainCategory);
    if (subCategory) {
      search.set('q', subCategory);
    }
    if (query) {
      search.set('q', `${query} ${subCategory}`.trim());
    }
    if (city) {
      search.set('q', `${search.get('q') ?? ''} ${city}`.trim());
    }
    router.push(`/${locale}/search?${search.toString()}`);
  }

  return (
    <div className="space-y-4">
      <section className="rounded-3xl bg-gradient-to-br from-brand-700 to-brand-500 p-5 text-white">
        <h1 className="text-2xl font-semibold leading-tight">Book local services in minutes</h1>
        <p className="mt-2 text-sm text-blue-100">Germany-first booking platform for beauty, wellness and more.</p>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {(Object.keys(CATEGORY_MAP) as MainCategory[]).map((key) => {
            const active = key === mainCategory;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelectMain(key)}
                className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                  active ? 'border-brand-500 bg-blue-50 text-brand-700' : 'border-slate-200'
                }`}
              >
                <CategoryIcon category={key} />
                {CATEGORY_MAP[key].label}
              </button>
            );
          })}
        </div>

        {subMenuOpen ? (
          <div className="rounded-xl bg-slate-50 p-3">
            <ul className="space-y-2 text-sm">
              {current.sub.map((item) => (
                <li key={item}>
                  <button
                    type="button"
                    onClick={() => setSubCategory(item)}
                    className={`w-full rounded-lg px-2 py-1 text-left ${
                      subCategory === item ? 'bg-white font-semibold text-brand-700' : 'text-slate-700'
                    }`}
                  >
                    {item}
                  </button>
                </li>
              ))}
              <li className="pt-1 font-semibold text-slate-900">{current.allLabel}</li>
            </ul>
          </div>
        ) : (
          <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
            Klicke auf eine Kategorie, um Unterkategorien zu sehen.
          </p>
        )}
      </section>

      <section className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <input
          className="rounded-xl border p-3"
          placeholder="City or postal code"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <input
          className="rounded-xl border p-3"
          placeholder="Search business or service"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="button" className="rounded-xl bg-brand-500 p-3 font-medium text-white" onClick={onSearch}>
          Search now
        </button>
      </section>
    </div>
  );
}
