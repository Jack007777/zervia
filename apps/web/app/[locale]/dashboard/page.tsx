'use client';

import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { AuthGuard } from '../../../src/components/AuthGuard';
import {
  useAdminAds,
  useAdminBusinesses,
  useAdminUsers,
  useBusinessBookings,
  useBusinessCustomerList,
  useConfirmBooking,
  useCounterProposeBooking,
  useCreateBusiness,
  useCreateAd,
  useDeleteBusinessCustomerListEntry,
  useDeleteBusiness,
  useMyBusinesses,
  useMyAds,
  useRejectBooking,
  useUpsertBusinessCustomerListEntry,
  useUpdateBusiness,
  useUpdateAdminBusiness,
  useUpdateAdminUser,
  useUpdateAdStatus
} from '../../../src/lib/api/hooks';
import { getSessionUser } from '../../../src/lib/auth/session';

type BranchAddressSuggestion = {
  placeId: string;
  label: string;
  lat: number;
  lng: number;
};

export default function DashboardPage() {
  const { locale } = useParams<{ locale: 'de' | 'en' }>();
  const session = getSessionUser();
  const roles = session?.roles ?? [];
  const isAdmin = roles.includes('admin');
  const isBusiness = roles.includes('business');

  return (
    <AuthGuard locale={locale}>
      {isAdmin ? <AdminDashboard /> : null}
      {!isAdmin && isBusiness ? <BusinessDashboard locale={locale} /> : null}
      {!isAdmin && !isBusiness ? (
        <div className="rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-sm">
          Dashboard is available for business/admin accounts only.
        </div>
      ) : null}
    </AuthGuard>
  );
}

function AdminDashboard() {
  const usersQuery = useAdminUsers();
  const adsQuery = useAdminAds();
  const businessesQuery = useAdminBusinesses();
  const updateUser = useUpdateAdminUser();
  const updateBusiness = useUpdateAdminBusiness();
  const updateAdStatus = useUpdateAdStatus();
  const [bizFilter, setBizFilter] = useState<'all' | 'virtual' | 'real'>('all');

  const businessRows = useMemo(() => {
    const all = businessesQuery.data ?? [];
    if (bizFilter === 'virtual') {
      return all.filter((item) => item.isVirtual);
    }
    if (bizFilter === 'real') {
      return all.filter((item) => !item.isVirtual);
    }
    return all;
  }, [businessesQuery.data, bizFilter]);

  const businessStats = useMemo(() => {
    const all = businessesQuery.data ?? [];
    return {
      total: all.length,
      virtual: all.filter((item) => item.isVirtual).length,
      real: all.filter((item) => !item.isVirtual).length
    };
  }, [businessesQuery.data]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Admin dashboard</h1>
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-medium">Account management</h2>
        {usersQuery.isLoading ? <p className="text-sm text-slate-600">Loading users...</p> : null}
        <div className="space-y-2">
          {(usersQuery.data ?? []).map((user) => (
            <article key={user._id} className="rounded-xl border p-3 text-sm">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="font-medium">{user.email ?? user.phone ?? 'no-identifier'}</p>
                <div className="flex items-center gap-1">
                  {user.manualPhoneApprovalPending ? (
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-700">
                      Pending SMS review
                    </span>
                  ) : null}
                  <span className={`rounded-full px-2 py-1 text-xs ${user.isActive ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                    {user.isActive ? 'Active' : 'Disabled'}
                  </span>
                </div>
              </div>
              <p className="mb-2 text-slate-600">
                Roles: {user.roles.join(', ')} | Phone verified: {user.phoneVerified ? 'Yes' : 'No'}
              </p>
              <div className="flex flex-wrap gap-2">
                {user.manualPhoneApprovalPending ? (
                  <button
                    type="button"
                    className="rounded-lg border px-2 py-1"
                    onClick={async () => {
                      await updateUser.mutateAsync({
                        userId: user._id,
                        isActive: true,
                        phoneVerified: true,
                        manualPhoneApprovalPending: false
                      });
                      await usersQuery.refetch();
                    }}
                  >
                    Approve SMS registration
                  </button>
                ) : null}
                <button
                  type="button"
                  className="rounded-lg border px-2 py-1"
                  onClick={async () => {
                    await updateUser.mutateAsync({
                      userId: user._id,
                      isActive: !user.isActive
                    });
                    await usersQuery.refetch();
                  }}
                >
                  {user.isActive ? 'Disable' : 'Enable'}
                </button>
                <button
                  type="button"
                  className="rounded-lg border px-2 py-1"
                  onClick={async () => {
                    const nextRoles: Array<'customer' | 'business' | 'admin'> = user.roles.includes('admin')
                      ? ['business']
                      : ['admin', 'business'];
                    await updateUser.mutateAsync({
                      userId: user._id,
                      roles: nextRoles
                    });
                    await usersQuery.refetch();
                  }}
                >
                  Toggle admin
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-medium">Business management</h2>
          <select
            className="rounded-lg border px-2 py-1 text-xs"
            value={bizFilter}
            onChange={(e) => setBizFilter(e.target.value as 'all' | 'virtual' | 'real')}
          >
            <option value="all">All ({businessStats.total})</option>
            <option value="virtual">Virtual ({businessStats.virtual})</option>
            <option value="real">Real ({businessStats.real})</option>
          </select>
        </div>
        {businessesQuery.isLoading ? <p className="text-sm text-slate-600">Loading businesses...</p> : null}
        <div className="space-y-2">
          {businessRows.map((biz) => (
            <article key={biz._id} className="rounded-xl border p-3 text-sm">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="font-medium">{biz.name}</p>
                <div className="flex items-center gap-1">
                  {biz.isVirtual ? (
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-700">Virtual</span>
                  ) : null}
                  <span className={`rounded-full px-2 py-1 text-xs ${biz.isActive ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                    {biz.isActive ? 'Active' : 'Disabled'}
                  </span>
                </div>
              </div>
              <p className="mb-2 text-slate-600">
                {biz.category ?? 'Uncategorized'} | {biz.city} | {biz.country}
              </p>
              {biz.virtualSeedBatch ? <p className="mb-2 text-xs text-slate-500">Batch: {biz.virtualSeedBatch}</p> : null}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-lg border px-2 py-1"
                  onClick={async () => {
                    await updateBusiness.mutateAsync({
                      businessId: biz._id,
                      isActive: !biz.isActive
                    });
                    await businessesQuery.refetch();
                  }}
                >
                  {biz.isActive ? 'Disable' : 'Enable'}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-medium">Ad records</h2>
        {adsQuery.isLoading ? <p className="text-sm text-slate-600">Loading ad records...</p> : null}
        <div className="space-y-2">
          {(adsQuery.data ?? []).map((ad) => (
            <article key={ad._id} className="rounded-xl border p-3 text-sm">
              <p className="font-medium">{ad.title}</p>
              <p className="mb-2 text-slate-600">
                Status: {ad.status} | Budget: {ad.budgetDaily} {ad.currency}
              </p>
              <div className="flex flex-wrap gap-2">
                {(['approved', 'rejected', 'paused', 'active'] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    className="rounded-lg border px-2 py-1"
                    onClick={async () => {
                      await updateAdStatus.mutateAsync({ adId: ad._id, status });
                      await adsQuery.refetch();
                    }}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function BusinessDashboard({ locale }: { locale: 'de' | 'en' }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'branches' | 'bookings' | 'customers' | 'marketing' | 'settings'>(
    'overview'
  );
  const myBusinesses = useMyBusinesses('DE');
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [manualBusinessId, setManualBusinessId] = useState('');
  const [bookingMode, setBookingMode] = useState<'instant' | 'request'>('instant');
  const [requireVerifiedPhoneForBooking, setRequireVerifiedPhoneForBooking] = useState(false);
  const [modeMessage, setModeMessage] = useState('');
  const [counterTimes, setCounterTimes] = useState<Record<string, string>>({});
  const [bookingMessage, setBookingMessage] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [landingUrl, setLandingUrl] = useState('');
  const [budgetDaily, setBudgetDaily] = useState('20');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [customerListType, setCustomerListType] = useState<'none' | 'whitelist' | 'blacklist'>('whitelist');
  const [customerListMessage, setCustomerListMessage] = useState('');
  const [branchName, setBranchName] = useState('');
  const [branchCategory, setBranchCategory] = useState('massage');
  const [branchAddressLine, setBranchAddressLine] = useState('');
  const [branchLat, setBranchLat] = useState('52.520008');
  const [branchLng, setBranchLng] = useState('13.404954');
  const [branchAddressSuggestions, setBranchAddressSuggestions] = useState<BranchAddressSuggestion[]>([]);
  const [showBranchAddressSuggestions, setShowBranchAddressSuggestions] = useState(false);
  const [branchAddressLookupLoading, setBranchAddressLookupLoading] = useState(false);
  const [branchPriceMin, setBranchPriceMin] = useState('');
  const [branchPriceMax, setBranchPriceMax] = useState('');
  const [branchCreateMessage, setBranchCreateMessage] = useState('');
  const [branchEditName, setBranchEditName] = useState('');
  const [branchEditCategory, setBranchEditCategory] = useState('massage');
  const [branchEditPriceMin, setBranchEditPriceMin] = useState('');
  const [branchEditPriceMax, setBranchEditPriceMax] = useState('');
  const [branchEditMessage, setBranchEditMessage] = useState('');
  const createAd = useCreateAd();
  const createBusiness = useCreateBusiness();
  const deleteBusiness = useDeleteBusiness();
  const myAds = useMyAds();
  const updateBusiness = useUpdateBusiness();
  const activeBusinessId = selectedBusinessId || manualBusinessId.trim();
  const businesses = useMemo(() => myBusinesses.data ?? [], [myBusinesses.data]);
  const activeBusiness = useMemo(
    () => businesses.find((item) => item._id === selectedBusinessId),
    [businesses, selectedBusinessId]
  );
  const businessBookings = useBusinessBookings(activeBusinessId, 'DE');
  const customerListQuery = useBusinessCustomerList(activeBusinessId, 'DE');
  const upsertCustomerEntry = useUpsertBusinessCustomerListEntry();
  const deleteCustomerEntry = useDeleteBusinessCustomerListEntry();
  const confirmBooking = useConfirmBooking();
  const counterProposeBooking = useCounterProposeBooking();
  const rejectBooking = useRejectBooking();

  const canSubmit = useMemo(() => Boolean(activeBusinessId && title.trim()), [activeBusinessId, title]);
  const bookingItems = businessBookings.data ?? [];
  const customerEntries = customerListQuery.data ?? [];
  const adItems = myAds.data ?? [];
  const pendingBookingsCount = bookingItems.filter((booking) => booking.status === 'pending').length;
  const activeAdsCount = adItems.filter((ad) => ['active', 'approved'].includes(ad.status)).length;

  useEffect(() => {
    if (!selectedBusinessId && businesses.length > 0) {
      setSelectedBusinessId(businesses[0]._id);
    }
  }, [businesses, selectedBusinessId]);

  useEffect(() => {
    if (!activeBusiness) {
      return;
    }
    setBookingMode(activeBusiness.bookingMode ?? 'instant');
    setRequireVerifiedPhoneForBooking(Boolean(activeBusiness.requireVerifiedPhoneForBooking));
  }, [activeBusiness]);

  useEffect(() => {
    const query = branchAddressLine.trim();
    if (query.length < 3) {
      setBranchAddressSuggestions([]);
      setShowBranchAddressSuggestions(false);
      setBranchAddressLookupLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setBranchAddressLookupLoading(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=de&limit=6&q=${encodeURIComponent(query)}`;
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'accept-language': locale === 'de' ? 'de' : 'en'
          }
        });
        if (!response.ok) {
          setBranchAddressSuggestions([]);
          setShowBranchAddressSuggestions(false);
          return;
        }
        const payload = (await response.json()) as Array<{
          place_id: number | string;
          display_name: string;
          lat: string;
          lon: string;
        }>;
        const next = payload.map((item) => ({
          placeId: String(item.place_id),
          label: item.display_name,
          lat: Number(item.lat),
          lng: Number(item.lon)
        }));
        setBranchAddressSuggestions(next);
        setShowBranchAddressSuggestions(true);
      } catch {
        setBranchAddressSuggestions([]);
        setShowBranchAddressSuggestions(false);
      } finally {
        setBranchAddressLookupLoading(false);
      }
    }, 260);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [branchAddressLine, locale]);

  useEffect(() => {
    if (!activeBusiness) {
      setBranchEditName('');
      setBranchEditCategory('massage');
      setBranchEditPriceMin('');
      setBranchEditPriceMax('');
      return;
    }
    setBranchEditName(activeBusiness.name ?? '');
    setBranchEditCategory(activeBusiness.category ?? 'massage');
    setBranchEditPriceMin(activeBusiness.priceMin !== undefined ? String(activeBusiness.priceMin) : '');
    setBranchEditPriceMax(activeBusiness.priceMax !== undefined ? String(activeBusiness.priceMax) : '');
  }, [activeBusiness]);

  return (
    <div className="space-y-4">
      <section className="rounded-[28px] bg-slate-900 p-5 text-white shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">Merchant workspace</p>
            <h1 className="text-2xl font-semibold">{locale === 'de' ? 'Geschäftsübersicht' : 'Business overview'}</h1>
            <p className="max-w-2xl text-sm text-slate-300">
              {locale === 'de'
                ? 'Arbeite wie in einem echten Backoffice: Filialen verwalten, Buchungen prüfen, bekannte Kunden markieren und Kampagnen steuern.'
                : 'Run your day from one place: manage branches, review bookings, label repeat customers and launch campaigns.'}
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3 text-sm text-slate-100">
            <p className="font-medium">{activeBusiness?.name ?? (locale === 'de' ? 'Keine Filiale gewählt' : 'No branch selected')}</p>
            <p className="text-slate-300">
              {activeBusiness ? `${activeBusiness.city}, ${activeBusiness.country}` : locale === 'de' ? 'Wähle unten eine Filiale aus.' : 'Select a branch below.'}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          label={locale === 'de' ? 'Filialen' : 'Branches'}
          value={String(businesses.length)}
          hint={locale === 'de' ? 'Aktive Standorte in deinem Konto' : 'Locations linked to your account'}
        />
        <DashboardMetricCard
          label={locale === 'de' ? 'Offene Anfragen' : 'Pending requests'}
          value={String(pendingBookingsCount)}
          hint={locale === 'de' ? 'Buchungen, die deine Antwort brauchen' : 'Bookings waiting for your response'}
        />
        <DashboardMetricCard
          label={locale === 'de' ? 'Markierte Kunden' : 'Tagged customers'}
          value={String(customerEntries.length)}
          hint={locale === 'de' ? 'Whitelist-, Blacklist- und Notiz-Einträge' : 'Whitelist, blacklist and note entries'}
        />
        <DashboardMetricCard
          label={locale === 'de' ? 'Aktive Anzeigen' : 'Active ads'}
          value={String(activeAdsCount)}
          hint={locale === 'de' ? 'Laufende oder freigegebene Kampagnen' : 'Ads currently approved or running'}
        />
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">{locale === 'de' ? 'Schnellzugriff' : 'Quick access'}</h2>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          <DashboardPanelButton active={activeTab === 'overview'} label={locale === 'de' ? 'Übersicht' : 'Overview'} hint={locale === 'de' ? 'Kennzahlen und Tagesfokus' : 'Metrics and daily focus'} onClick={() => setActiveTab('overview')} />
          <DashboardPanelButton active={activeTab === 'branches'} label={locale === 'de' ? 'Filialen' : 'Branches'} hint={locale === 'de' ? 'Filialen anlegen und bearbeiten' : 'Create and edit branches'} onClick={() => setActiveTab('branches')} />
          <DashboardPanelButton active={activeTab === 'bookings'} label={locale === 'de' ? 'Buchungen' : 'Bookings'} hint={locale === 'de' ? 'Anfragen bestätigen oder verschieben' : 'Confirm or counter requests'} onClick={() => setActiveTab('bookings')} />
          <DashboardPanelButton active={activeTab === 'customers'} label={locale === 'de' ? 'Kunden' : 'Customers'} hint={locale === 'de' ? 'Whitelist, Blacklist, Notizen' : 'Whitelist, blacklist, notes'} onClick={() => setActiveTab('customers')} />
          <DashboardPanelButton active={activeTab === 'marketing'} label={locale === 'de' ? 'Marketing' : 'Marketing'} hint={locale === 'de' ? 'Anzeigen einreichen und prüfen' : 'Submit ads and review performance'} onClick={() => setActiveTab('marketing')} />
          <DashboardPanelButton active={activeTab === 'settings'} label={locale === 'de' ? 'Einstellungen' : 'Settings'} hint={locale === 'de' ? 'Buchungsmodus und Regeln' : 'Booking mode and policy'} onClick={() => setActiveTab('settings')} />
        </div>
      </section>

      {activeTab === 'overview' ? (
        <section className="grid gap-4 xl:grid-cols-[1.15fr,0.85fr]">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">{locale === 'de' ? 'Heute wichtig' : 'Today at a glance'}</h2>
            <div className="mt-3 space-y-3">
              <article className="rounded-xl border border-slate-200 p-3">
                <p className="text-sm font-medium text-slate-900">{locale === 'de' ? 'Buchungen mit Priorität' : 'Priority bookings'}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {pendingBookingsCount > 0
                    ? locale === 'de'
                      ? `${pendingBookingsCount} Anfrage(n) warten auf Bestätigung oder Gegenvorschlag.`
                      : `${pendingBookingsCount} request(s) are waiting for confirmation or counter proposal.`
                    : locale === 'de'
                      ? 'Aktuell sind keine offenen Buchungsanfragen vorhanden.'
                      : 'There are no pending booking requests right now.'}
                </p>
                <button type="button" className="mt-3 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700" onClick={() => setActiveTab('bookings')}>
                  {locale === 'de' ? 'Zu den Buchungen' : 'Open bookings'}
                </button>
              </article>
              <article className="rounded-xl border border-slate-200 p-3">
                <p className="text-sm font-medium text-slate-900">{locale === 'de' ? 'Filialstatus' : 'Branch status'}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {activeBusiness
                    ? locale === 'de'
                      ? `Aktive Filiale: ${activeBusiness.name}. Kategorie: ${activeBusiness.category ?? 'n/a'}.`
                      : `Current branch: ${activeBusiness.name}. Category: ${activeBusiness.category ?? 'n/a'}.`
                    : locale === 'de'
                      ? 'Lege eine Filiale an oder wähle eine bestehende aus.'
                      : 'Create a branch or select an existing one.'}
                </p>
                <button type="button" className="mt-3 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700" onClick={() => setActiveTab('branches')}>
                  {locale === 'de' ? 'Filialen verwalten' : 'Manage branches'}
                </button>
              </article>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">{locale === 'de' ? 'Aktueller Modus' : 'Current mode'}</h2>
            <div className="mt-3 space-y-3">
              <article className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{locale === 'de' ? 'Buchungsmodus' : 'Booking mode'}</p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {bookingMode === 'instant' ? (locale === 'de' ? 'Sofort buchbar' : 'Instant booking') : locale === 'de' ? 'Anfrage mit Bestätigung' : 'Request and confirm'}
                </p>
              </article>
              <article className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{locale === 'de' ? 'Telefonregel' : 'Phone rule'}</p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {requireVerifiedPhoneForBooking
                    ? locale === 'de'
                      ? 'Nur telefonverifizierte Kunden dürfen buchen'
                      : 'Only phone-verified users can book'
                    : locale === 'de'
                      ? 'Alle registrierten Kunden dürfen buchen'
                      : 'All registered users can book'}
                </p>
              </article>
              <button type="button" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700" onClick={() => setActiveTab('settings')}>
                {locale === 'de' ? 'Einstellungen öffnen' : 'Open settings'}
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {(activeTab === 'branches' || activeTab === 'overview') ? (
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-medium">My branches</h2>
        {myBusinesses.isLoading ? <p className="text-sm text-slate-600">Loading branches...</p> : null}
        {(myBusinesses.data ?? []).length ? (
          <select
            className="w-full rounded-xl border p-2"
            value={selectedBusinessId}
            onChange={(e) => setSelectedBusinessId(e.target.value)}
          >
            <option value="">Select branch</option>
            {(myBusinesses.data ?? []).map((item) => (
              <option key={item._id} value={item._id}>
                {item.name} - {item.city} {item.isVirtual ? '(Virtual)' : ''}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-sm text-slate-600">{locale === 'de' ? 'Noch keine Filiale vorhanden.' : 'No branch assigned yet.'}</p>
        )}
        <p className="mt-2 text-xs text-slate-500">{locale === 'de' ? 'Du kannst optional auch eine Business ID manuell einfügen.' : 'You can still paste a Business ID manually if needed.'}</p>
        <input
          className="mt-2 w-full rounded-xl border p-2"
          placeholder="Manual Business ID (optional)"
          value={manualBusinessId}
          onChange={(e) => setManualBusinessId(e.target.value)}
        />

        <div className="mt-4 rounded-xl border p-3">
          <h3 className="mb-2 text-sm font-semibold">{locale === 'de' ? 'Neue Filiale anlegen' : 'Create new branch'}</h3>
          <div className="grid gap-2">
            <input
              className="rounded-xl border p-2"
              placeholder={locale === 'de' ? 'Filialname' : 'Branch name'}
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
            />
            <input
              className="rounded-xl border p-2"
              placeholder={locale === 'de' ? 'Kategorie (z. B. massage)' : 'Category (e.g. massage)'}
              value={branchCategory}
              onChange={(e) => setBranchCategory(e.target.value)}
            />
            <input
              className="rounded-xl border p-2"
              placeholder={locale === 'de' ? 'Adresse / Straße' : 'Address / street'}
              value={branchAddressLine}
              onChange={(e) => setBranchAddressLine(e.target.value)}
              onFocus={() => {
                if (branchAddressSuggestions.length > 0) {
                  setShowBranchAddressSuggestions(true);
                }
              }}
              onBlur={() => {
                setTimeout(() => setShowBranchAddressSuggestions(false), 120);
              }}
            />
            {branchAddressLookupLoading ? (
              <p className="text-xs text-slate-500">
                {locale === 'de' ? 'Suche Adressen ...' : 'Searching addresses ...'}
              </p>
            ) : null}
            {showBranchAddressSuggestions && branchAddressSuggestions.length > 0 ? (
              <div className="max-h-56 overflow-auto rounded-xl border bg-white shadow-sm">
                {branchAddressSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.placeId}
                    type="button"
                    className="block w-full border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-slate-50"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setBranchAddressLine(suggestion.label);
                      setBranchLat(String(Number(suggestion.lat.toFixed(6))));
                      setBranchLng(String(Number(suggestion.lng.toFixed(6))));
                      setShowBranchAddressSuggestions(false);
                    }}
                  >
                    {suggestion.label}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="grid grid-cols-2 gap-2">
              <input
                className="rounded-xl border p-2"
                placeholder="Lat"
                value={branchLat}
                onChange={(e) => setBranchLat(e.target.value)}
              />
              <input
                className="rounded-xl border p-2"
                placeholder="Lng"
                value={branchLng}
                onChange={(e) => setBranchLng(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                className="rounded-xl border p-2"
                type="number"
                min="0"
                placeholder={locale === 'de' ? 'Preis min' : 'Price min'}
                value={branchPriceMin}
                onChange={(e) => setBranchPriceMin(e.target.value)}
              />
              <input
                className="rounded-xl border p-2"
                type="number"
                min="0"
                placeholder={locale === 'de' ? 'Preis max' : 'Price max'}
                value={branchPriceMax}
                onChange={(e) => setBranchPriceMax(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="rounded-xl bg-brand-500 p-2 text-white disabled:opacity-50"
              disabled={!branchName.trim() || !branchCategory.trim() || !branchAddressLine.trim() || createBusiness.isPending}
              onClick={async () => {
                setBranchCreateMessage('');
                try {
                  const created = await createBusiness.mutateAsync({
                    name: branchName.trim(),
                    category: branchCategory.trim(),
                    location: {
                      addressLine: branchAddressLine.trim(),
                      lat: Number(branchLat) || 52.520008,
                      lng: Number(branchLng) || 13.404954
                    },
                    priceMin: branchPriceMin ? Number(branchPriceMin) : undefined,
                    priceMax: branchPriceMax ? Number(branchPriceMax) : undefined,
                    country: 'DE'
                  });
                  setBranchCreateMessage(locale === 'de' ? 'Filiale wurde erstellt.' : 'Branch created successfully.');
                  setSelectedBusinessId(created._id);
                  setManualBusinessId('');
                  setBranchName('');
                  setBranchAddressLine('');
                  setBranchPriceMin('');
                  setBranchPriceMax('');
                  await myBusinesses.refetch();
                } catch (error) {
                  setBranchCreateMessage(error instanceof Error ? error.message : locale === 'de' ? 'Erstellen fehlgeschlagen.' : 'Failed to create branch.');
                }
              }}
            >
              {createBusiness.isPending
                ? locale === 'de'
                  ? 'Erstelle Filiale...'
                  : 'Creating branch...'
                : locale === 'de'
                  ? 'Filiale erstellen'
                  : 'Create branch'}
            </button>
            {branchCreateMessage ? <p className="text-xs text-slate-700">{branchCreateMessage}</p> : null}
          </div>
        </div>

        {activeBusinessId ? (
          <div className="mt-4 rounded-xl border p-3">
            <h3 className="mb-2 text-sm font-semibold">{locale === 'de' ? 'Ausgewählte Filiale bearbeiten' : 'Edit selected branch'}</h3>
            <div className="grid gap-2">
              <input
                className="rounded-xl border p-2"
                placeholder={locale === 'de' ? 'Filialname' : 'Branch name'}
                value={branchEditName}
                onChange={(e) => setBranchEditName(e.target.value)}
              />
              <input
                className="rounded-xl border p-2"
                placeholder={locale === 'de' ? 'Kategorie' : 'Category'}
                value={branchEditCategory}
                onChange={(e) => setBranchEditCategory(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="rounded-xl border p-2"
                  type="number"
                  min="0"
                  placeholder={locale === 'de' ? 'Preis min' : 'Price min'}
                  value={branchEditPriceMin}
                  onChange={(e) => setBranchEditPriceMin(e.target.value)}
                />
                <input
                  className="rounded-xl border p-2"
                  type="number"
                  min="0"
                  placeholder={locale === 'de' ? 'Preis max' : 'Price max'}
                  value={branchEditPriceMax}
                  onChange={(e) => setBranchEditPriceMax(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="rounded-xl bg-slate-900 p-2 text-white disabled:opacity-50"
                disabled={!activeBusinessId || !branchEditName.trim() || updateBusiness.isPending}
                onClick={async () => {
                  setBranchEditMessage('');
                  try {
                    await updateBusiness.mutateAsync({
                      businessId: activeBusinessId,
                      name: branchEditName.trim(),
                      category: branchEditCategory.trim(),
                      priceMin: branchEditPriceMin ? Number(branchEditPriceMin) : undefined,
                      priceMax: branchEditPriceMax ? Number(branchEditPriceMax) : undefined
                    });
                    setBranchEditMessage(locale === 'de' ? 'Filiale aktualisiert.' : 'Branch updated.');
                    await myBusinesses.refetch();
                  } catch (error) {
                    setBranchEditMessage(error instanceof Error ? error.message : locale === 'de' ? 'Aktualisierung fehlgeschlagen.' : 'Update failed.');
                  }
                }}
              >
                {updateBusiness.isPending
                  ? locale === 'de'
                    ? 'Speichere...'
                    : 'Saving...'
                  : locale === 'de'
                    ? 'Filiale speichern'
                    : 'Save branch'}
              </button>
              <button
                type="button"
                className="rounded-xl border border-rose-200 p-2 text-rose-700 disabled:opacity-50"
                disabled={!activeBusinessId || deleteBusiness.isPending}
                onClick={async () => {
                  const confirmed = window.confirm(
                    locale === 'de'
                      ? 'Diese Filiale endgültig löschen? Zugehörige Services, Buchungen, Kundenlisten und Anzeigen werden ebenfalls entfernt.'
                      : 'Delete this branch permanently? Related services, bookings, customer lists and ads will be removed too.'
                  );
                  if (!confirmed) {
                    return;
                  }

                  setBranchEditMessage('');
                  try {
                    const result = await deleteBusiness.mutateAsync({
                      businessId: activeBusinessId
                    });
                    const currentId = activeBusinessId;
                    const refreshed = await myBusinesses.refetch();
                    const remaining = refreshed.data ?? [];
                    const nextBusiness =
                      remaining.find((item) => item._id !== currentId) ??
                      remaining[0];
                    setSelectedBusinessId(nextBusiness?._id ?? '');
                    setManualBusinessId('');
                    setBranchEditMessage(
                      result.mode === 'archived'
                        ? locale === 'de'
                          ? `Filiale archiviert. Endgültige Löschung nach dem ${new Date(
                              result.deletionScheduledAt ?? ''
                            ).toLocaleDateString('de-DE')}.`
                          : `Branch archived. Permanent deletion after ${new Date(
                              result.deletionScheduledAt ?? ''
                            ).toLocaleDateString('en-GB')}.`
                        : locale === 'de'
                          ? 'Filiale endgültig gelöscht.'
                          : 'Branch deleted permanently.'
                    );
                  } catch (error) {
                    setBranchEditMessage(
                      error instanceof Error
                        ? error.message
                        : locale === 'de'
                          ? 'Löschen fehlgeschlagen.'
                          : 'Delete failed.'
                    );
                  }
                }}
              >
                {deleteBusiness.isPending
                  ? locale === 'de'
                    ? 'Entferne...'
                    : 'Removing...'
                  : locale === 'de'
                    ? 'Filiale löschen'
                    : 'Delete branch'}
              </button>
              {branchEditMessage ? <p className="text-xs text-slate-700">{branchEditMessage}</p> : null}
            </div>
          </div>
        ) : null}
      </section>
      ) : null}

      {(activeTab === 'settings' || activeTab === 'overview') ? (
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-medium">Booking mode</h2>
        <p className="mb-2 text-xs text-slate-600">
          Visible only in business dashboard. Instant = customer books visible slots directly. Request = customer sends preferred time, merchant confirms or sends counter proposal.
        </p>
        <div className="grid gap-2">
          <select
            className="rounded-xl border p-2"
            value={bookingMode}
            onChange={(e) => setBookingMode(e.target.value as 'instant' | 'request')}
          >
            <option value="instant">Instant booking</option>
            <option value="request">Request booking (hidden availability)</option>
          </select>
          <label className="flex items-center gap-2 rounded-xl border p-2 text-sm">
            <input
              type="checkbox"
              checked={requireVerifiedPhoneForBooking}
              onChange={(e) => setRequireVerifiedPhoneForBooking(e.target.checked)}
            />
            Only phone-verified users can book
          </label>
          <button
            type="button"
            className="rounded-xl bg-slate-900 p-2 text-white disabled:opacity-50"
            disabled={!activeBusinessId || updateBusiness.isPending}
            onClick={async () => {
              await updateBusiness.mutateAsync({
                businessId: activeBusinessId,
                bookingMode,
                requireVerifiedPhoneForBooking
              });
              setModeMessage(
                `Updated: mode="${bookingMode}", phone-verified-only=${requireVerifiedPhoneForBooking ? 'on' : 'off'}`
              );
            }}
          >
            {updateBusiness.isPending ? 'Saving...' : 'Save booking mode'}
          </button>
          {modeMessage ? <p className="text-xs text-emerald-700">{modeMessage}</p> : null}
        </div>
      </section>
      ) : null}

      {activeTab === 'marketing' ? (
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-medium">Publish ad</h2>
        <div className="grid gap-2">
          <input className="rounded-xl border p-2" placeholder="Ad title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea
            className="rounded-xl border p-2"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <input
            className="rounded-xl border p-2"
            placeholder="Landing URL (https://...)"
            value={landingUrl}
            onChange={(e) => setLandingUrl(e.target.value)}
          />
          <input
            className="rounded-xl border p-2"
            type="number"
            min="1"
            placeholder="Daily budget"
            value={budgetDaily}
            onChange={(e) => setBudgetDaily(e.target.value)}
          />
          <button
            type="button"
            className="rounded-xl bg-brand-500 p-2 text-white disabled:opacity-50"
            disabled={!canSubmit || createAd.isPending}
            onClick={async () => {
              await createAd.mutateAsync({
                businessId: activeBusinessId,
                title: title.trim(),
                description: description.trim() || undefined,
                landingUrl: landingUrl.trim() || undefined,
                budgetDaily: Number(budgetDaily) || 20
              });
              setTitle('');
              setDescription('');
              setLandingUrl('');
              await myAds.refetch();
            }}
          >
            {createAd.isPending ? 'Submitting...' : 'Submit ad'}
          </button>
        </div>
      </section>
      ) : null}

      {activeTab === 'customers' ? (
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-medium">
          {locale === 'de' ? 'Kundenliste (Whitelist/Blacklist)' : 'Customer whitelist / blacklist'}
        </h2>
        <p className="mb-2 text-xs text-slate-600">
          {locale === 'de'
            ? 'Nutze Telefonnummern, um Stammkunden zu markieren oder problematische Nutzer zu sperren.'
            : 'Use phone numbers to label repeat customers or block abusive users.'}
        </p>
        {!activeBusinessId ? (
          <p className="text-sm text-slate-500">
            {locale === 'de' ? 'Bitte zuerst eine Filiale auswählen.' : 'Select a branch first.'}
          </p>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-2">
              <input
                className="rounded-xl border p-2"
                placeholder={locale === 'de' ? 'Telefon (+49...)' : 'Phone (+49...)'}
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
              <input
                className="rounded-xl border p-2"
                placeholder={locale === 'de' ? 'Eigener Name (optional)' : 'Custom name (optional)'}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
              <input
                className="rounded-xl border p-2"
                placeholder={locale === 'de' ? 'Notiz (optional)' : 'Note (optional)'}
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
              />
              <select
                className="rounded-xl border p-2"
                value={customerListType}
                onChange={(e) => setCustomerListType(e.target.value as 'none' | 'whitelist' | 'blacklist')}
              >
                <option value="whitelist">{locale === 'de' ? 'Whitelist' : 'Whitelist'}</option>
                <option value="blacklist">{locale === 'de' ? 'Blacklist' : 'Blacklist'}</option>
                <option value="none">{locale === 'de' ? 'Neutral' : 'Neutral'}</option>
              </select>
              <button
                type="button"
                className="rounded-xl bg-slate-900 p-2 text-white disabled:opacity-50"
                disabled={!customerPhone.trim() || upsertCustomerEntry.isPending}
                onClick={async () => {
                  try {
                    await upsertCustomerEntry.mutateAsync({
                      businessId: activeBusinessId,
                      phone: customerPhone.trim(),
                      customName: customerName.trim() || undefined,
                      note: customerNote.trim() || undefined,
                      listType: customerListType,
                      country: 'DE'
                    });
                    setCustomerListMessage(locale === 'de' ? 'Eintrag gespeichert' : 'Saved customer entry');
                    setCustomerPhone('');
                    setCustomerName('');
                    setCustomerNote('');
                    await customerListQuery.refetch();
                  } catch (error) {
                    setCustomerListMessage(
                      error instanceof Error ? error.message : locale === 'de' ? 'Speichern fehlgeschlagen' : 'Failed to save'
                    );
                  }
                }}
              >
                {upsertCustomerEntry.isPending
                  ? locale === 'de'
                    ? 'Speichern...'
                    : 'Saving...'
                  : locale === 'de'
                    ? 'Eintrag speichern'
                    : 'Save entry'}
              </button>
              {customerListMessage ? <p className="text-xs text-emerald-700">{customerListMessage}</p> : null}
            </div>

            {customerListQuery.isLoading ? (
              <p className="text-sm text-slate-600">
                {locale === 'de' ? 'Kundenliste wird geladen...' : 'Loading customer list...'}
              </p>
            ) : null}
            <div className="space-y-2">
              {(customerListQuery.data ?? []).map((entry) => (
                <article key={entry._id} className="rounded-xl border p-3 text-sm">
                  <div className="mb-1 flex items-center justify-between">
                    <p className="font-medium">{entry.customName || entry.phone}</p>
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                        entry.listType === 'blacklist'
                          ? 'bg-rose-100 text-rose-700'
                          : entry.listType === 'whitelist'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {entry.listType}
                    </span>
                  </div>
                  <p className="text-slate-600">{entry.phone}</p>
                  {entry.note ? <p className="text-slate-500">{entry.note}</p> : null}
                  <button
                    type="button"
                    className="mt-2 rounded-lg border px-2 py-1"
                    onClick={async () => {
                      await deleteCustomerEntry.mutateAsync({
                        businessId: activeBusinessId,
                        phone: entry.phone,
                        country: 'DE'
                      });
                      await customerListQuery.refetch();
                    }}
                  >
                    {locale === 'de' ? 'Entfernen' : 'Remove'}
                  </button>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
      ) : null}

      {(activeTab === 'bookings' || activeTab === 'overview') ? (
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-medium">Booking requests</h2>
        <p className="mb-2 text-xs text-slate-600">
          Select a branch above. In request mode, customers send preferred time and you can confirm, reject, or send a counter proposal.
        </p>
        {!activeBusinessId ? <p className="text-sm text-slate-500">Please select a branch or provide a Business ID first.</p> : null}
        {businessBookings.isLoading ? <p className="text-sm text-slate-600">Loading bookings...</p> : null}
        {bookingMessage ? <p className="mb-2 text-xs text-emerald-700">{bookingMessage}</p> : null}
        <div className="space-y-2">
          {(businessBookings.data ?? []).map((booking) => (
            <article key={booking._id} className="rounded-xl border p-3 text-sm">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="font-medium">
                  {booking.mode === 'request' ? 'Request booking' : 'Instant booking'} | {booking.status}
                </p>
                <span className="text-xs text-slate-500">{booking.country ?? 'DE'}</span>
              </div>
              <p className="text-slate-700">Booking ID: {booking._id}</p>
              <p className="text-slate-700">Service: {booking.serviceId}</p>
              <p className="text-slate-700">Customer: {booking.guestName ?? booking.customerUserId ?? 'N/A'}</p>
              <p className="text-slate-700">Phone: {booking.guestPhone ?? 'N/A'}</p>
              <p className="text-slate-700">Start: {new Date(booking.startTime).toLocaleString('de-DE')}</p>
              {booking.requestedStartTime ? (
                <p className="text-slate-700">Requested: {new Date(booking.requestedStartTime).toLocaleString('de-DE')}</p>
              ) : null}
              {booking.counterProposedStartTime ? (
                <p className="text-slate-700">
                  Counter: {new Date(booking.counterProposedStartTime).toLocaleString('de-DE')}
                </p>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-lg border px-2 py-1"
                  onClick={async () => {
                    await confirmBooking.mutateAsync({ bookingId: booking._id });
                    setBookingMessage(`Confirmed ${booking._id}`);
                    await businessBookings.refetch();
                  }}
                >
                  Confirm
                </button>
                <button
                  type="button"
                  className="rounded-lg border px-2 py-1"
                  onClick={async () => {
                    await rejectBooking.mutateAsync({ bookingId: booking._id, reason: 'Rejected by merchant' });
                    setBookingMessage(`Rejected ${booking._id}`);
                    await businessBookings.refetch();
                  }}
                >
                  Reject
                </button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <input
                  type="datetime-local"
                  className="rounded-lg border px-2 py-1"
                  value={counterTimes[booking._id] ?? ''}
                  onChange={(e) =>
                    setCounterTimes((prev) => ({
                      ...prev,
                      [booking._id]: e.target.value
                    }))
                  }
                />
                <button
                  type="button"
                  className="rounded-lg border px-2 py-1"
                  onClick={async () => {
                    const value = counterTimes[booking._id];
                    if (!value) {
                      setBookingMessage('Please select counter proposal time.');
                      return;
                    }
                    await counterProposeBooking.mutateAsync({
                      bookingId: booking._id,
                      proposedStartTime: new Date(value).toISOString(),
                      note: 'Counter proposal from merchant'
                    });
                    setBookingMessage(`Counter proposed for ${booking._id}`);
                    await businessBookings.refetch();
                  }}
                >
                  Send counter proposal
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
      ) : null}

      {activeTab === 'marketing' ? (
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-medium">My ad records</h2>
        {myAds.isLoading ? <p className="text-sm text-slate-600">Loading...</p> : null}
        <div className="space-y-2">
          {(myAds.data ?? []).map((ad) => (
            <article key={ad._id} className="rounded-xl border p-3 text-sm">
              <p className="font-medium">{ad.title}</p>
              <p className="text-slate-600">
                {ad.status} | {ad.budgetDaily} {ad.currency} | Impr: {ad.impressions} | Clicks: {ad.clicks}
              </p>
            </article>
          ))}
        </div>
      </section>
      ) : null}
    </div>
  );
}

function DashboardMetricCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{hint}</p>
    </article>
  );
}

function DashboardPanelButton({
  active,
  label,
  hint,
  onClick
}: {
  active: boolean;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-3 text-left transition ${
        active ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
      }`}
    >
      <p className="text-sm font-semibold">{label}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </button>
  );
}
