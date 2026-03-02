'use client';

import { useParams } from 'next/navigation';
import { FormEvent, useState } from 'react';

import { uiCopy } from '../../../src/lib/ui-copy';

export default function PartnersPage() {
  const { locale } = useParams<{ locale: 'de' | 'en' }>();
  const [state, setState] = useState({ businessName: '', contactName: '', phone: '', city: '', serviceCategory: 'massage' });
  const [status, setStatus] = useState('');

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus('');

    const response = await fetch('/api/partner-leads', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...state, locale, country: 'DE' })
    });

    if (!response.ok) {
      setStatus(locale === 'de' ? 'Senden fehlgeschlagen.' : 'Submission failed.');
      return;
    }

    setStatus(locale === 'de' ? 'Danke. Wir melden uns innerhalb von 24h.' : 'Thanks. We will contact you within 24h.');
    setState({ businessName: '', contactName: '', phone: '', city: '', serviceCategory: 'massage' });
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-500 p-5 text-white">
        <h1 className="text-2xl font-semibold">{uiCopy[locale].partnersTitle}</h1>
        <p className="mt-2 text-sm text-emerald-50">{uiCopy[locale].partnersSubtitle}</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-emerald-50">
          <li>24/7 online booking</li>
          <li>Auto reminders reduce no-shows</li>
          <li>Performance dashboard and ad tools</li>
        </ul>
      </section>

      <form className="space-y-2 rounded-2xl bg-white p-4 shadow-sm" onSubmit={onSubmit}>
        <label className="grid gap-1 text-sm">
          Business name
          <input className="rounded-xl border p-3" required value={state.businessName} onChange={(e) => setState((p) => ({ ...p, businessName: e.target.value }))} />
        </label>
        <label className="grid gap-1 text-sm">
          Contact name
          <input className="rounded-xl border p-3" required value={state.contactName} onChange={(e) => setState((p) => ({ ...p, contactName: e.target.value }))} />
        </label>
        <label className="grid gap-1 text-sm">
          Phone
          <input className="rounded-xl border p-3" required value={state.phone} onChange={(e) => setState((p) => ({ ...p, phone: e.target.value }))} />
        </label>
        <label className="grid gap-1 text-sm">
          City
          <input className="rounded-xl border p-3" required value={state.city} onChange={(e) => setState((p) => ({ ...p, city: e.target.value }))} />
        </label>
        <label className="grid gap-1 text-sm">
          Category
          <select className="rounded-xl border p-3" value={state.serviceCategory} onChange={(e) => setState((p) => ({ ...p, serviceCategory: e.target.value }))}>
            <option value="friseur">Friseur</option>
            <option value="naegel">Naegel</option>
            <option value="kosmetik">Kosmetik</option>
            <option value="massage">Massage</option>
          </select>
        </label>
        <button type="submit" className="w-full rounded-xl bg-brand-500 p-3 font-medium text-white">
          Submit request
        </button>
        {status ? <p className="text-sm text-slate-700">{status}</p> : null}
      </form>
    </div>
  );
}
