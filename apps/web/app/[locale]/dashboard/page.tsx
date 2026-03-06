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
  const myAds = useMyAds();
  const updateBusiness = useUpdateBusiness();
  const activeBusinessId = selectedBusinessId || manualBusinessId.trim();
  const activeBusiness = useMemo(
    () => (myBusinesses.data ?? []).find((item) => item._id === selectedBusinessId),
    [myBusinesses.data, selectedBusinessId]
  );
  const businessBookings = useBusinessBookings(activeBusinessId, 'DE');
  const customerListQuery = useBusinessCustomerList(activeBusinessId, 'DE');
  const upsertCustomerEntry = useUpsertBusinessCustomerListEntry();
  const deleteCustomerEntry = useDeleteBusinessCustomerListEntry();
  const confirmBooking = useConfirmBooking();
  const counterProposeBooking = useCounterProposeBooking();
  const rejectBooking = useRejectBooking();

  const canSubmit = useMemo(() => Boolean(activeBusinessId && title.trim()), [activeBusinessId, title]);

  useEffect(() => {
    if (!activeBusiness) {
      return;
    }
    setBookingMode(activeBusiness.bookingMode ?? 'instant');
    setRequireVerifiedPhoneForBooking(Boolean(activeBusiness.requireVerifiedPhoneForBooking));
  }, [activeBusiness]);

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
      <h1 className="text-xl font-semibold">Business dashboard</h1>
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
            />
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
              {branchEditMessage ? <p className="text-xs text-slate-700">{branchEditMessage}</p> : null}
            </div>
          </div>
        ) : null}
      </section>

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
    </div>
  );
}
