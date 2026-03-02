'use client';

import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';

import { AuthGuard } from '../../../src/components/AuthGuard';
import {
  useAdminAds,
  useAdminBusinesses,
  useAdminUsers,
  useCreateAd,
  useMyAds,
  useUpdateAdminBusiness,
  useUpdateAdminUser,
  useUpdateAdStatus
} from '../../../src/lib/api/hooks';
import { getSessionUser } from '../../../src/lib/auth/session';

export default function DashboardPage() {
  const { locale } = useParams<{ locale: string }>();
  const session = getSessionUser();
  const roles = session?.roles ?? [];
  const isAdmin = roles.includes('admin');
  const isBusiness = roles.includes('business');

  return (
    <AuthGuard locale={locale}>
      {isAdmin ? <AdminDashboard /> : null}
      {!isAdmin && isBusiness ? <BusinessDashboard /> : null}
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
                <p className="font-medium">{user.email}</p>
                <span className={`rounded-full px-2 py-1 text-xs ${user.isActive ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                  {user.isActive ? 'Active' : 'Disabled'}
                </span>
              </div>
              <p className="mb-2 text-slate-600">Roles: {user.roles.join(', ')}</p>
              <div className="flex flex-wrap gap-2">
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

function BusinessDashboard() {
  const [businessId, setBusinessId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [landingUrl, setLandingUrl] = useState('');
  const [budgetDaily, setBudgetDaily] = useState('20');
  const createAd = useCreateAd();
  const myAds = useMyAds();

  const canSubmit = useMemo(() => businessId.trim() && title.trim(), [businessId, title]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Business dashboard</h1>
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-medium">Publish ad</h2>
        <div className="grid gap-2">
          <input
            className="rounded-xl border p-2"
            placeholder="Business ID"
            value={businessId}
            onChange={(e) => setBusinessId(e.target.value)}
          />
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
                businessId: businessId.trim(),
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
