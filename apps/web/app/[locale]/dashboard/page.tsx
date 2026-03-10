'use client';

import { useParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

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
  useDeleteMyAd,
  useDeleteBusinessCustomerListEntry,
  useDeleteBusiness,
  useMyBusinesses,
  useMyAds,
  useRejectBooking,
  useUploadBusinessImage,
  useUpsertBusinessCustomerListEntry,
  useUpdateBusiness,
  useUpdateAdminBusiness,
  useUpdateMyAdStatus,
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

type DashboardIconName =
  | 'branch'
  | 'category'
  | 'address'
  | 'price'
  | 'save'
  | 'delete'
  | 'settings'
  | 'bookings'
  | 'customers'
  | 'marketing'
  | 'overview'
  | 'location'
  | 'branch-plus'
  | 'link'
  | 'gallery'
  | 'phone'
  | 'note'
  | 'confirm'
  | 'reject'
  | 'counter';

function parseGalleryImages(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function appendGalleryImage(currentValue: string, nextUrl: string) {
  const existing = parseGalleryImages(currentValue);
  if (existing.includes(nextUrl)) {
    return currentValue;
  }
  return [...existing, nextUrl].join('\n');
}

function getBranchSummaryLabel(branch: { name?: string; city?: string; addressLine?: string }) {
  return branch.name?.trim() || branch.city?.trim() || branch.addressLine?.trim() || 'Branch';
}

function getBranchMetaLabel(branch: { city?: string; country?: string; postalCode?: string; addressLine?: string }) {
  const parts = [branch.city?.trim(), branch.postalCode?.trim(), branch.country?.trim()].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(' \u00b7 ');
  }

  return branch.addressLine?.trim() || '';
}

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
        <div className="min-w-0 flex-1 space-y-2">
          {(usersQuery.data ?? []).map((user) => (
            <article key={user._id} className="rounded-xl border p-3 text-sm">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="font-medium">{user.email ?? user.phone ?? 'no-identifier'}</p>
                <div className="flex items-center gap-1">
                  {user.manualPhoneApprovalPending ? (
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-700">
                      Awaiting manual SMS review
                    </span>
                  ) : null}
                  <span className={`rounded-full px-2 py-1 text-xs ${user.isActive ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                    {user.isActive ? 'Active' : 'Disabled'}
                  </span>
                </div>
              </div>
              <p className="mb-2 text-slate-600">
                Roles: {user.roles.join(', ')} | Phone status: {user.phoneVerified ? 'Phone-verified user' : 'Not verified'}
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
                    Mark as phone-verified user
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
        <div className="min-w-0 flex-1 space-y-2">
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
  const branchCategoryOptions = [
    { value: 'friseur', label: locale === 'de' ? 'Friseur' : 'Hair' },
    { value: 'naegel', label: locale === 'de' ? 'Nägel' : 'Nails' },
    { value: 'haarentfernung', label: locale === 'de' ? 'Haarentfernung' : 'Hair removal' },
    { value: 'kosmetik', label: locale === 'de' ? 'Kosmetik' : 'Beauty' },
    { value: 'massage', label: locale === 'de' ? 'Massage' : 'Massage' },
    { value: 'maenner', label: locale === 'de' ? 'Männer' : "Men's grooming" }
  ];
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
  const [adMessage, setAdMessage] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [customerListType, setCustomerListType] = useState<'none' | 'whitelist' | 'blacklist'>('whitelist');
  const [customerListMessage, setCustomerListMessage] = useState('');
  const [isCreateBranchOpen, setIsCreateBranchOpen] = useState(false);
  const [isBranchMenuOpen, setIsBranchMenuOpen] = useState(false);
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [branchName, setBranchName] = useState('');
  const [branchCategory, setBranchCategory] = useState('massage');
  const [branchDescription, setBranchDescription] = useState('');
  const [branchGalleryImagesText, setBranchGalleryImagesText] = useState('');
  const [branchGalleryFiles, setBranchGalleryFiles] = useState<File[]>([]);
  const [branchAddressLine, setBranchAddressLine] = useState('');
  const [branchLat, setBranchLat] = useState('52.520008');
  const [branchLng, setBranchLng] = useState('13.404954');
  const [branchAddressSuggestions, setBranchAddressSuggestions] = useState<BranchAddressSuggestion[]>([]);
  const [showBranchAddressSuggestions, setShowBranchAddressSuggestions] = useState(false);
  const [branchAddressLookupLoading, setBranchAddressLookupLoading] = useState(false);
  const [branchPriceMin, setBranchPriceMin] = useState('');
  const [branchPriceMax, setBranchPriceMax] = useState('');
  const [branchCreateMessage, setBranchCreateMessage] = useState('');
  const [branchUploadMessage, setBranchUploadMessage] = useState('');
  const [branchEditName, setBranchEditName] = useState('');
  const [branchEditCategory, setBranchEditCategory] = useState('massage');
  const [branchEditDescription, setBranchEditDescription] = useState('');
  const [branchEditGalleryImagesText, setBranchEditGalleryImagesText] = useState('');
  const [branchEditPriceMin, setBranchEditPriceMin] = useState('');
  const [branchEditPriceMax, setBranchEditPriceMax] = useState('');
  const [branchEditMessage, setBranchEditMessage] = useState('');
  const [branchEditUploadMessage, setBranchEditUploadMessage] = useState('');
  const createAd = useCreateAd();
  const updateMyAdStatus = useUpdateMyAdStatus();
  const deleteMyAd = useDeleteMyAd();
  const createBusiness = useCreateBusiness();
  const uploadBusinessImage = useUploadBusinessImage();
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
  const branchMenuRef = useRef<HTMLDivElement | null>(null);
  const branchesSectionRef = useRef<HTMLElement | null>(null);
  const bookingsSectionRef = useRef<HTMLElement | null>(null);
  const customersSectionRef = useRef<HTMLElement | null>(null);
  const marketingSectionRef = useRef<HTMLElement | null>(null);
  const settingsSectionRef = useRef<HTMLElement | null>(null);
  const createGalleryPreview = useMemo(() => parseGalleryImages(branchGalleryImagesText), [branchGalleryImagesText]);
  const editGalleryPreview = useMemo(() => parseGalleryImages(branchEditGalleryImagesText), [branchEditGalleryImagesText]);
  const workspaceNavigation: Array<{
    key: 'overview' | 'branches' | 'bookings' | 'customers' | 'marketing' | 'settings';
    label: string;
    hint: string;
    icon: DashboardIconName;
  }> = [
    {
      key: 'overview',
      label: locale === 'de' ? 'Übersicht' : 'Overview',
      hint: locale === 'de' ? 'Kennzahlen und Tagesfokus' : 'Metrics and daily focus',
      icon: 'overview'
    },
    {
      key: 'branches',
      label: locale === 'de' ? 'Filialen' : 'Branches',
      hint: locale === 'de' ? 'Filialen anlegen und bearbeiten' : 'Create and edit branches',
      icon: 'branch'
    },
    {
      key: 'bookings',
      label: locale === 'de' ? 'Buchungen' : 'Bookings',
      hint: locale === 'de' ? 'Anfragen bestätigen oder verschieben' : 'Confirm or counter requests',
      icon: 'bookings'
    },
    {
      key: 'customers',
      label: locale === 'de' ? 'Kunden' : 'Customers',
      hint: locale === 'de' ? 'Whitelist, Blacklist, Notizen' : 'Whitelist, blacklist, notes',
      icon: 'customers'
    },
    {
      key: 'marketing',
      label: locale === 'de' ? 'Marketing' : 'Marketing',
      hint: locale === 'de' ? 'Anzeigen einreichen und prüfen' : 'Submit ads and review performance',
      icon: 'marketing'
    },
    {
      key: 'settings',
      label: locale === 'de' ? 'Einstellungen' : 'Settings',
      hint: locale === 'de' ? 'Buchungsmodus und Regeln' : 'Booking mode and policy',
      icon: 'settings'
    }
  ];

  useEffect(() => {
    if (!selectedBusinessId && businesses.length > 0) {
      setSelectedBusinessId(businesses[0]._id);
    }
  }, [businesses, selectedBusinessId]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (branchMenuRef.current && !branchMenuRef.current.contains(event.target as Node)) {
        setIsBranchMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

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
      setBranchEditDescription('');
      setBranchEditGalleryImagesText('');
      setBranchEditPriceMin('');
      setBranchEditPriceMax('');
      return;
    }
    setBranchEditName(activeBusiness.name ?? '');
    setBranchEditCategory(activeBusiness.category ?? 'massage');
    setBranchEditDescription(activeBusiness.description ?? '');
    setBranchEditGalleryImagesText((activeBusiness.galleryImages ?? []).join('\n'));
    setBranchEditPriceMin(activeBusiness.priceMin !== undefined ? String(activeBusiness.priceMin) : '');
    setBranchEditPriceMax(activeBusiness.priceMax !== undefined ? String(activeBusiness.priceMax) : '');
  }, [activeBusiness]);

  const scrollToSection = (tab: 'overview' | 'branches' | 'bookings' | 'customers' | 'marketing' | 'settings') => {
    const refMap = {
      overview: null,
      branches: branchesSectionRef,
      bookings: bookingsSectionRef,
      customers: customersSectionRef,
      marketing: marketingSectionRef,
      settings: settingsSectionRef
    } as const;

    const targetRef = refMap[tab];
    window.requestAnimationFrame(() => {
      targetRef?.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    });
  };

  const handleTabChange = (tab: 'overview' | 'branches' | 'bookings' | 'customers' | 'marketing' | 'settings') => {
    setActiveTab(tab);
    setIsWorkspaceMenuOpen(false);
    if (tab !== 'overview') {
      scrollToSection(tab);
    }
  };

  const handleBranchImageUpload = async (
    businessId: string,
    currentValue: string,
    files: FileList | null,
    onUpdateValue: (nextValue: string) => void,
    onMessage: (message: string) => void
  ) => {
    if (!files || files.length === 0) {
      return;
    }

    onMessage(locale === 'de' ? 'Bilder werden hochgeladen ...' : 'Uploading images ...');

    try {
      let nextValue = currentValue;
      for (const file of Array.from(files)) {
        const result = await uploadBusinessImage.mutateAsync({ businessId, file });
        nextValue = appendGalleryImage(nextValue, result.url);
      }
      await updateBusiness.mutateAsync({
        businessId,
        galleryImages: parseGalleryImages(nextValue)
      });
      onUpdateValue(nextValue);
      onMessage(locale === 'de' ? 'Bild hochgeladen.' : 'Image uploaded.');
    } catch (error) {
      onMessage(
        error instanceof Error
          ? error.message
          : locale === 'de'
            ? 'Bild-Upload fehlgeschlagen.'
            : 'Image upload failed.'
      );
    }
  };

  return (
    <div className="space-y-4">
      {isWorkspaceMenuOpen ? (
        <div className="fixed inset-0 z-40 bg-slate-950/35" onClick={() => setIsWorkspaceMenuOpen(false)}>
          <aside
            className="flex h-full w-[min(84vw,320px)] flex-col gap-4 bg-white p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {locale === 'de' ? 'Navigation' : 'Navigation'}
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {locale === 'de' ? 'Arbeitsbereiche' : 'Workspace areas'}
                </p>
              </div>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600"
                onClick={() => setIsWorkspaceMenuOpen(false)}
                aria-label={locale === 'de' ? 'Menü schließen' : 'Close menu'}
              >
                <span className="text-lg leading-none">×</span>
              </button>
            </div>
            <div className="space-y-2">
              {workspaceNavigation.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`block w-full rounded-2xl border px-4 py-3 text-left transition ${
                    activeTab === item.key
                      ? 'border-brand-200 bg-brand-50 text-brand-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                  onClick={() => handleTabChange(item.key)}
                >
                  <span className="flex items-center gap-3">
                    <DashboardIcon name={item.icon} className="h-4 w-4" />
                    <span>
                      <span className="block text-sm font-semibold">{item.label}</span>
                      <span className="mt-1 block text-xs text-slate-500">{item.hint}</span>
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </aside>
        </div>
      ) : null}
      <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <button
              type="button"
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:border-slate-300 hover:bg-white"
              onClick={() => setIsWorkspaceMenuOpen(true)}
              aria-label={locale === 'de' ? 'Arbeitsbereiche öffnen' : 'Open workspace areas'}
            >
              <span className="flex flex-col gap-1">
                <span className="block h-0.5 w-5 rounded-full bg-current" />
                <span className="block h-0.5 w-5 rounded-full bg-current" />
                <span className="block h-0.5 w-5 rounded-full bg-current" />
              </span>
            </button>
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                {locale === 'de' ? 'Arbeitsbereich' : 'Workspace'}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <span className="rounded-full bg-brand-50 px-3 py-1 font-medium text-brand-700">
                  {workspaceNavigation.find((item) => item.key === activeTab)?.label ?? (locale === 'de' ? 'Übersicht' : 'Overview')}
                </span>
                <span className="text-slate-400">•</span>
                <span className="truncate">
                  {workspaceNavigation.find((item) => item.key === activeTab)?.hint}
                </span>
              </div>
            </div>
          </div>
          <div ref={branchMenuRef} className="relative min-w-0 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <DashboardIcon name="branch" className="h-4 w-4" />
              {locale === 'de' ? 'Aktive Filiale' : 'Active branch'}
            </p>
            {(myBusinesses.data ?? []).length ? (
              <div className="mt-2">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-900 outline-none transition hover:border-slate-300 hover:bg-slate-50"
                  onClick={() => setIsBranchMenuOpen((prev) => !prev)}
                >
                  <span className="min-w-0 truncate">
                    {activeBusiness ? getBranchSummaryLabel(activeBusiness) : locale === 'de' ? 'Filiale ausw\u00e4hlen' : 'Select branch'}
                  </span>
                  <span className={`shrink-0 text-slate-500 transition ${isBranchMenuOpen ? 'rotate-180' : ''}`}>{"\u25be"}</span>
                </button>
                {isBranchMenuOpen ? (
                  <div className="mt-2 max-h-72 overflow-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                    {(myBusinesses.data ?? []).map((item) => {
                      const isActiveBranch = item._id === selectedBusinessId;
                      return (
                        <button
                          key={item._id}
                          type="button"
                          className={`block w-full rounded-xl px-3 py-2 text-left transition ${
                            isActiveBranch ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                          onClick={() => {
                            setSelectedBusinessId(item._id);
                            setManualBusinessId('');
                            setIsBranchMenuOpen(false);
                          }}
                        >
                          <p className="truncate font-medium">{getBranchSummaryLabel(item)}</p>
                          <p className="mt-1 truncate text-xs text-slate-300">{getBranchMetaLabel(item)}</p>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="mt-2 text-slate-500">{locale === 'de' ? 'Noch keine Filiale vorhanden.' : 'No branch assigned yet.'}</p>
            )}
            <p className="mt-3 truncate font-medium text-slate-900">{activeBusiness?.name ?? (locale === 'de' ? 'Keine Filiale gew\u00e4hlt' : 'No branch selected')}</p>
            <p className="truncate text-slate-500">
              {activeBusiness
                ? getBranchMetaLabel(activeBusiness) || activeBusiness.addressLine
                : locale === 'de'
                  ? 'W\u00e4hle hier oben eine Filiale aus.'
                  : 'Select a branch above.'}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          icon="branch"
          label={locale === 'de' ? 'Filialen' : 'Branches'}
          value={String(businesses.length)}
          hint={locale === 'de' ? 'Aktive Standorte in deinem Konto' : 'Locations linked to your account'}
          onClick={() => handleTabChange('branches')}
        />
        <DashboardMetricCard
          icon="bookings"
          label={locale === 'de' ? 'Offene Anfragen' : 'Pending requests'}
          value={String(pendingBookingsCount)}
          hint={locale === 'de' ? 'Buchungen, die deine Antwort brauchen' : 'Bookings waiting for your response'}
          onClick={() => handleTabChange('bookings')}
        />
        <DashboardMetricCard
          icon="customers"
          label={locale === 'de' ? 'Markierte Kunden' : 'Tagged customers'}
          value={String(customerEntries.length)}
          hint={locale === 'de' ? 'Whitelist-, Blacklist- und Notiz-Einträge' : 'Whitelist, blacklist and note entries'}
        />
        <DashboardMetricCard
          icon="marketing"
          label={locale === 'de' ? 'Aktive Anzeigen' : 'Active ads'}
          value={String(activeAdsCount)}
          hint={locale === 'de' ? 'Laufende oder freigegebene Kampagnen' : 'Ads currently approved or running'}
          onClick={() => handleTabChange('marketing')}
        />
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
                <button type="button" className="mt-3 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700" onClick={() => handleTabChange('bookings')}>
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
                <button type="button" className="mt-3 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700" onClick={() => handleTabChange('branches')}>
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
                      ? 'Nur telefonverifizierte Kunden d\u00fcrfen buchen'
                      : 'Only phone-verified users can book'
                    : locale === 'de'
                      ? 'Alle registrierten Kunden d\u00fcrfen buchen'
                      : 'All registered users can book'}
                </p>
              </article>
              <button type="button" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700" onClick={() => handleTabChange('settings')}>
                {locale === 'de' ? 'Einstellungen öffnen' : 'Open settings'}
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {(activeTab === 'branches' || activeTab === 'overview') ? (
      <section ref={branchesSectionRef} className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-medium">My branches</h2>
        <p className="text-sm text-slate-600">
          {activeBusiness
            ? locale === 'de'
              ? `Aktuell bearbeitest du ${activeBusiness.name}.`
              : `You are currently editing ${activeBusiness.name}.`
            : locale === 'de'
              ? 'Wähle oben im Workspace zuerst eine Filiale aus oder nutze unten eine Business ID.'
              : 'Select a branch from the workspace card above or use a Business ID below.'}
        </p>
        <label className="mt-2 grid gap-1 text-xs font-medium text-slate-600">
          <span className="flex items-center gap-2">
            <DashboardIcon name="link" className="h-4 w-4" />
            {locale === 'de' ? 'Manuelle Business ID' : 'Manual business ID'}
          </span>
          <input
            className="w-full rounded-xl border p-2"
            placeholder="Manual Business ID (optional)"
            value={manualBusinessId}
            onChange={(e) => setManualBusinessId(e.target.value)}
          />
        </label>

        <div className="mt-4 rounded-xl border p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">{locale === 'de' ? 'Neue Filiale anlegen' : 'Create new branch'}</h3>
              <p className="mt-1 text-xs text-slate-500">
                {locale === 'de'
                  ? 'Standardmäßig eingeklappt, damit dein Dashboard übersichtlich bleibt.'
                  : 'Collapsed by default to keep your workspace focused.'}
              </p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
              onClick={() => setIsCreateBranchOpen((prev) => !prev)}
            >
              <DashboardIcon name="branch-plus" className="h-4 w-4" />
              {isCreateBranchOpen
                ? locale === 'de'
                  ? 'Schließen'
                  : 'Close'
                : locale === 'de'
                  ? 'Neue Filiale'
                  : 'New branch'}
            </button>
          </div>
          {isCreateBranchOpen ? (
            <div className="mt-3 grid gap-2">
              <label className="grid gap-1 text-xs font-medium text-slate-600">
                <span className="flex items-center gap-2">
                  <DashboardIcon name="branch" className="h-4 w-4" />
                  {locale === 'de' ? 'Filialname' : 'Branch name'}
                </span>
                <input
                  className="rounded-xl border p-2"
                  placeholder={locale === 'de' ? 'Filialname' : 'Branch name'}
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                />
              </label>
              <label className="grid gap-1 text-xs font-medium text-slate-600">
                <span className="flex items-center gap-2">
                  <DashboardIcon name="category" className="h-4 w-4" />
                  {locale === 'de' ? 'Kategorie / Serviceart' : 'Category / service type'}
                </span>
                <select className="rounded-xl border p-2" value={branchCategory} onChange={(e) => setBranchCategory(e.target.value)}>
                  {branchCategoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-xs font-medium text-slate-600">
                <span className="flex items-center gap-2">
                  <DashboardIcon name="note" className="h-4 w-4" />
                  {locale === 'de' ? '店铺介绍 / Beschreibung' : 'Shop introduction'}
                </span>
                <textarea
                  className="min-h-24 rounded-xl border p-2"
                  placeholder={locale === 'de' ? 'Kurz vorstellen, was diese Filiale anbietet' : 'Describe this branch and its specialties'}
                  value={branchDescription}
                  onChange={(e) => setBranchDescription(e.target.value)}
                />
              </label>
              <label className="grid gap-1 text-xs font-medium text-slate-600">
                <span className="flex items-center gap-2">
                  <DashboardIcon name="gallery" className="h-4 w-4" />
                  {locale === 'de' ? 'Bilder (1 URL pro Zeile)' : 'Image gallery (1 URL per line)'}
                </span>
                <textarea
                  className="min-h-24 rounded-xl border p-2"
                  placeholder="https://..."
                  value={branchGalleryImagesText}
                  onChange={(e) => setBranchGalleryImagesText(e.target.value)}
                />
              </label>
              <BranchGalleryPreview images={createGalleryPreview} />
              <label className="grid gap-1 text-xs font-medium text-slate-600">
                <span className="flex items-center gap-2">
                  <DashboardIcon name="address" className="h-4 w-4" />
                  {locale === 'de' ? 'Adresse / Straße' : 'Address / street'}
                </span>
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
              </label>
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
                <label className="grid gap-1 text-xs font-medium text-slate-600">
                  <span className="flex items-center gap-2">
                    <DashboardIcon name="location" className="h-4 w-4" />
                    Lat
                  </span>
                  <input
                    className="rounded-xl border p-2"
                    placeholder="Lat"
                    value={branchLat}
                    onChange={(e) => setBranchLat(e.target.value)}
                  />
                </label>
                <label className="grid gap-1 text-xs font-medium text-slate-600">
                  <span className="flex items-center gap-2">
                    <DashboardIcon name="location" className="h-4 w-4" />
                    Lng
                  </span>
                  <input
                    className="rounded-xl border p-2"
                    placeholder="Lng"
                    value={branchLng}
                    onChange={(e) => setBranchLng(e.target.value)}
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="grid gap-1 text-xs font-medium text-slate-600">
                  <span className="flex items-center gap-2">
                    <DashboardIcon name="price" className="h-4 w-4" />
                    {locale === 'de' ? 'Preis min' : 'Price min'}
                  </span>
                  <input
                    className="rounded-xl border p-2"
                    type="number"
                    min="0"
                    placeholder={locale === 'de' ? 'Preis min' : 'Price min'}
                    value={branchPriceMin}
                    onChange={(e) => setBranchPriceMin(e.target.value)}
                  />
                </label>
                <label className="grid gap-1 text-xs font-medium text-slate-600">
                  <span className="flex items-center gap-2">
                    <DashboardIcon name="price" className="h-4 w-4" />
                    {locale === 'de' ? 'Preis max' : 'Price max'}
                  </span>
                  <input
                    className="rounded-xl border p-2"
                    type="number"
                    min="0"
                    placeholder={locale === 'de' ? 'Preis max' : 'Price max'}
                    value={branchPriceMax}
                    onChange={(e) => setBranchPriceMax(e.target.value)}
                  />
                </label>
              </div>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 p-2 text-white disabled:opacity-50"
                disabled={!branchName.trim() || !branchCategory.trim() || !branchAddressLine.trim() || createBusiness.isPending}
                onClick={async () => {
                  setBranchCreateMessage('');
                  try {
                    const created = await createBusiness.mutateAsync({
                      name: branchName.trim(),
                      description: branchDescription.trim() || undefined,
                      galleryImages: parseGalleryImages(branchGalleryImagesText),
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
                    setBranchDescription('');
                    setBranchGalleryImagesText('');
                    setBranchAddressLine('');
                    setBranchPriceMin('');
                    setBranchPriceMax('');
                    setIsCreateBranchOpen(false);
                    await myBusinesses.refetch();
                  } catch (error) {
                    setBranchCreateMessage(error instanceof Error ? error.message : locale === 'de' ? 'Erstellen fehlgeschlagen.' : 'Failed to create branch.');
                  }
                }}
              >
                <DashboardIcon name="branch-plus" className="h-4 w-4" />
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
          ) : null}
        </div>

        {activeBusinessId ? (
          <div className="mt-4 rounded-xl border p-3">
            <h3 className="mb-2 text-sm font-semibold">{locale === 'de' ? 'Ausgewählte Filiale bearbeiten' : 'Edit selected branch'}</h3>
            <div className="grid gap-2">
              <label className="grid gap-1 text-xs font-medium text-slate-600">
                <span className="flex items-center gap-2">
                  <DashboardIcon name="branch" className="h-4 w-4" />
                  {locale === 'de' ? 'Filialname' : 'Branch name'}
                </span>
                <input
                  className="rounded-xl border p-2"
                  placeholder={locale === 'de' ? 'Filialname' : 'Branch name'}
                  value={branchEditName}
                  onChange={(e) => setBranchEditName(e.target.value)}
                />
              </label>
              <label className="grid gap-1 text-xs font-medium text-slate-600">
                <span className="flex items-center gap-2">
                  <DashboardIcon name="category" className="h-4 w-4" />
                  {locale === 'de' ? 'Kategorie / Serviceart' : 'Category / service type'}
                </span>
                <select className="rounded-xl border p-2" value={branchEditCategory} onChange={(e) => setBranchEditCategory(e.target.value)}>
                  {branchCategoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-xs font-medium text-slate-600">
                <span className="flex items-center gap-2">
                  <DashboardIcon name="note" className="h-4 w-4" />
                  {locale === 'de' ? '店铺介绍 / Beschreibung' : 'Shop introduction'}
                </span>
                <textarea
                  className="min-h-24 rounded-xl border p-2"
                  placeholder={locale === 'de' ? 'Kurz vorstellen, was diese Filiale anbietet' : 'Describe this branch and its specialties'}
                  value={branchEditDescription}
                  onChange={(e) => setBranchEditDescription(e.target.value)}
                />
              </label>
              <label className="grid gap-1 text-xs font-medium text-slate-600">
                <span className="flex items-center gap-2">
                  <DashboardIcon name="gallery" className="h-4 w-4" />
                  {locale === 'de' ? 'Bilder (1 URL pro Zeile)' : 'Image gallery (1 URL per line)'}
                </span>
                <textarea
                  className="min-h-24 rounded-xl border p-2"
                  placeholder="https://..."
                  value={branchEditGalleryImagesText}
                  onChange={(e) => setBranchEditGalleryImagesText(e.target.value)}
                />
              </label>
              <BranchGalleryPreview images={editGalleryPreview} />
              <div className="grid grid-cols-2 gap-2">
                <label className="grid gap-1 text-xs font-medium text-slate-600">
                  <span className="flex items-center gap-2">
                    <DashboardIcon name="price" className="h-4 w-4" />
                    {locale === 'de' ? 'Preis min' : 'Price min'}
                  </span>
                  <input
                    className="rounded-xl border p-2"
                    type="number"
                    min="0"
                    placeholder={locale === 'de' ? 'Preis min' : 'Price min'}
                    value={branchEditPriceMin}
                    onChange={(e) => setBranchEditPriceMin(e.target.value)}
                  />
                </label>
                <label className="grid gap-1 text-xs font-medium text-slate-600">
                  <span className="flex items-center gap-2">
                    <DashboardIcon name="price" className="h-4 w-4" />
                    {locale === 'de' ? 'Preis max' : 'Price max'}
                  </span>
                  <input
                    className="rounded-xl border p-2"
                    type="number"
                    min="0"
                    placeholder={locale === 'de' ? 'Preis max' : 'Price max'}
                    value={branchEditPriceMax}
                    onChange={(e) => setBranchEditPriceMax(e.target.value)}
                  />
                </label>
              </div>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 p-2 text-white disabled:opacity-50"
                disabled={!activeBusinessId || !branchEditName.trim() || updateBusiness.isPending}
                onClick={async () => {
                  setBranchEditMessage('');
                  try {
                    await updateBusiness.mutateAsync({
                      businessId: activeBusinessId,
                      name: branchEditName.trim(),
                      category: branchEditCategory.trim(),
                      description: branchEditDescription.trim() || undefined,
                      galleryImages: parseGalleryImages(branchEditGalleryImagesText),
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
                <DashboardIcon name="save" className="h-4 w-4" />
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
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 p-2 text-rose-700 disabled:opacity-50"
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
                <DashboardIcon name="delete" className="h-4 w-4" />
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
      <section ref={settingsSectionRef} className="rounded-2xl bg-white p-4 shadow-sm">
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
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 p-2 text-white disabled:opacity-50"
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
            <DashboardIcon name="settings" className="h-4 w-4" />
            {updateBusiness.isPending ? 'Saving...' : 'Save booking mode'}
          </button>
          {modeMessage ? <p className="text-xs text-emerald-700">{modeMessage}</p> : null}
        </div>
      </section>
      ) : null}

      {activeTab === 'marketing' ? (
      <section ref={customersSectionRef} className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-medium">Publish ad</h2>
        <div className="grid gap-2">
          <label className="grid gap-1 text-xs font-medium text-slate-600">
            <span className="flex items-center gap-2"><DashboardIcon name="marketing" className="h-4 w-4" />Ad title</span>
            <input className="rounded-xl border p-2" placeholder="Ad title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <textarea
            className="rounded-xl border p-2"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <label className="grid gap-1 text-xs font-medium text-slate-600">
            <span className="flex items-center gap-2"><DashboardIcon name="link" className="h-4 w-4" />Landing URL</span>
            <input
              className="rounded-xl border p-2"
              placeholder="Landing URL (https://...)"
              value={landingUrl}
              onChange={(e) => setLandingUrl(e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-xs font-medium text-slate-600">
            <span className="flex items-center gap-2"><DashboardIcon name="price" className="h-4 w-4" />Daily budget</span>
            <input
              className="rounded-xl border p-2"
              type="number"
              min="1"
              placeholder="Daily budget"
              value={budgetDaily}
              onChange={(e) => setBudgetDaily(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 p-2 text-white disabled:opacity-50"
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
            <DashboardIcon name="marketing" className="h-4 w-4" />
            {createAd.isPending ? 'Submitting...' : 'Submit ad'}
          </button>
        </div>
      </section>
      ) : null}

      {activeTab === 'customers' ? (
      <section ref={bookingsSectionRef} className="rounded-2xl bg-white p-4 shadow-sm">
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
              <label className="grid gap-1 text-xs font-medium text-slate-600">
                <span className="flex items-center gap-2"><DashboardIcon name="phone" className="h-4 w-4" />{locale === 'de' ? 'Telefon' : 'Phone'}</span>
                <input
                  className="rounded-xl border p-2"
                  placeholder={locale === 'de' ? 'Telefon (+49...)' : 'Phone (+49...)'}
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </label>
              <label className="grid gap-1 text-xs font-medium text-slate-600">
                <span className="flex items-center gap-2"><DashboardIcon name="customers" className="h-4 w-4" />{locale === 'de' ? 'Eigener Name' : 'Custom name'}</span>
                <input
                  className="rounded-xl border p-2"
                  placeholder={locale === 'de' ? 'Eigener Name (optional)' : 'Custom name (optional)'}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </label>
              <label className="grid gap-1 text-xs font-medium text-slate-600">
                <span className="flex items-center gap-2"><DashboardIcon name="note" className="h-4 w-4" />{locale === 'de' ? 'Notiz' : 'Note'}</span>
                <input
                  className="rounded-xl border p-2"
                  placeholder={locale === 'de' ? 'Notiz (optional)' : 'Note (optional)'}
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                />
              </label>
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
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 p-2 text-white disabled:opacity-50"
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
                <DashboardIcon name="save" className="h-4 w-4" />
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
                    className="mt-2 inline-flex items-center gap-2 rounded-lg border px-2 py-1"
                    onClick={async () => {
                      await deleteCustomerEntry.mutateAsync({
                        businessId: activeBusinessId,
                        phone: entry.phone,
                        country: 'DE'
                      });
                      await customerListQuery.refetch();
                    }}
                  >
                    <DashboardIcon name="delete" className="h-4 w-4" />
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
      <section ref={marketingSectionRef} className="rounded-2xl bg-white p-4 shadow-sm">
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
                  className="inline-flex items-center gap-2 rounded-lg border px-2 py-1"
                  onClick={async () => {
                    await confirmBooking.mutateAsync({ bookingId: booking._id });
                    setBookingMessage(`Confirmed ${booking._id}`);
                    await businessBookings.refetch();
                  }}
                >
                  <DashboardIcon name="confirm" className="h-4 w-4" />
                  Confirm
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-lg border px-2 py-1"
                  onClick={async () => {
                    await rejectBooking.mutateAsync({ bookingId: booking._id, reason: 'Rejected by merchant' });
                    setBookingMessage(`Rejected ${booking._id}`);
                    await businessBookings.refetch();
                  }}
                >
                  <DashboardIcon name="reject" className="h-4 w-4" />
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
                  className="inline-flex items-center gap-2 rounded-lg border px-2 py-1"
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
                  <DashboardIcon name="counter" className="h-4 w-4" />
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
        {adMessage ? <p className="mb-3 text-xs text-emerald-700">{adMessage}</p> : null}
        {myAds.isLoading ? <p className="text-sm text-slate-600">Loading...</p> : null}
        <div className="space-y-2">
          {(myAds.data ?? []).map((ad) => (
            <article key={ad._id} className="rounded-xl border p-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{ad.title}</p>
                  <p className="text-slate-600">
                    {ad.budgetDaily} {ad.currency} | Impr: {ad.impressions} | Clicks: {ad.clicks}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${
                    ad.status === 'active'
                      ? 'bg-emerald-100 text-emerald-700'
                      : ad.status === 'paused'
                        ? 'bg-amber-100 text-amber-700'
                        : ad.status === 'rejected'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {ad.status}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {ad.status !== 'active' ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-700"
                    disabled={updateMyAdStatus.isPending}
                    onClick={async () => {
                      await updateMyAdStatus.mutateAsync({ adId: ad._id, status: 'active' });
                      setAdMessage(locale === 'de' ? 'Anzeige aktiviert.' : 'Ad activated.');
                      await myAds.refetch();
                    }}
                  >
                    <DashboardIcon name="confirm" className="h-4 w-4" />
                    {locale === 'de' ? 'Aktivieren' : 'Activate'}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-amber-700"
                    disabled={updateMyAdStatus.isPending}
                    onClick={async () => {
                      await updateMyAdStatus.mutateAsync({ adId: ad._id, status: 'paused' });
                      setAdMessage(locale === 'de' ? 'Anzeige pausiert.' : 'Ad paused.');
                      await myAds.refetch();
                    }}
                  >
                    <DashboardIcon name="settings" className="h-4 w-4" />
                    {locale === 'de' ? 'Pausieren' : 'Pause'}
                  </button>
                )}
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-rose-700"
                  disabled={deleteMyAd.isPending}
                  onClick={async () => {
                    const confirmed = window.confirm(
                      locale === 'de' ? 'Diese Anzeige wirklich löschen?' : 'Delete this ad permanently?'
                    );
                    if (!confirmed) {
                      return;
                    }
                    await deleteMyAd.mutateAsync({ adId: ad._id });
                    setAdMessage(locale === 'de' ? 'Anzeige gelöscht.' : 'Ad deleted.');
                    await myAds.refetch();
                  }}
                >
                  <DashboardIcon name="delete" className="h-4 w-4" />
                  {locale === 'de' ? 'Löschen' : 'Delete'}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
      ) : null}
    </div>
  );
}

function DashboardIcon({ name, className = 'h-4 w-4' }: { name: DashboardIconName; className?: string }) {
  const shared = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true
  };

  switch (name) {
    case 'branch':
      return <svg {...shared}><path d="M4 20h16" /><path d="M6 20V8l6-4 6 4v12" /><path d="M9 12h6" /><path d="M10 20v-4h4v4" /></svg>;
    case 'branch-plus':
      return <svg {...shared}><path d="M4 20h10" /><path d="M6 20V8l5-3 5 3v5" /><path d="M14 13h6" /><path d="M17 10v6" /></svg>;
    case 'category':
      return <svg {...shared}><path d="M7 7h.01" /><path d="M3 11l8-8 10 10-8 8L3 11Z" /></svg>;
    case 'address':
      return <svg {...shared}><path d="M12 21s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11Z" /><circle cx="12" cy="10" r="2.5" /></svg>;
    case 'location':
      return <svg {...shared}><path d="M12 2v4" /><path d="M12 18v4" /><path d="M2 12h4" /><path d="M18 12h4" /><circle cx="12" cy="12" r="4" /></svg>;
    case 'price':
      return <svg {...shared}><path d="M12 3v18" /><path d="M16 7.5c0-2-1.8-3.5-4-3.5s-4 1.5-4 3.5 1.4 3 4 3 4 1 4 3.5-1.8 4-4 4-4-1.8-4-4" /></svg>;
    case 'save':
      return <svg {...shared}><path d="M5 21h14" /><path d="M7 21V5h8l2 2v14" /><path d="M9 5v5h6" /></svg>;
    case 'delete':
      return <svg {...shared}><path d="M4 7h16" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M6 7l1 13h10l1-13" /><path d="M9 7V4h6v3" /></svg>;
    case 'settings':
      return <svg {...shared}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.1a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.1a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.1a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6H20a2 2 0 1 1 0 4h-.1a1 1 0 0 0-.9.6Z" /></svg>;
    case 'bookings':
      return <svg {...shared}><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4" /><path d="M16 3v4" /><path d="M4 10h16" /></svg>;
    case 'customers':
      return <svg {...shared}><circle cx="9" cy="8" r="3" /><path d="M3 19c0-3 2.7-5 6-5" /><path d="M15 11h6" /><path d="M18 8v6" /></svg>;
    case 'marketing':
      return <svg {...shared}><path d="M4 15V5l12 4v6L4 19Z" /><path d="M16 9h2a2 2 0 0 1 0 4h-2" /><path d="M6 19v2" /></svg>;
    case 'overview':
      return <svg {...shared}><path d="M4 19h16" /><rect x="5" y="10" width="3" height="6" rx="1" /><rect x="10.5" y="7" width="3" height="9" rx="1" /><rect x="16" y="4" width="3" height="12" rx="1" /></svg>;
    case 'link':
      return <svg {...shared}><path d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1" /><path d="M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1" /></svg>;
    case 'gallery':
      return <svg {...shared}><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="1.5" /><path d="m21 16-4.5-4.5L11 17l-2.5-2.5L3 20" /></svg>;
    case 'phone':
      return <svg {...shared}><path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 11.2 19a19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.4 2.6a2 2 0 0 1-.6 1.7L7.2 9.8a16 16 0 0 0 7 7l1.8-1.7a2 2 0 0 1 1.7-.6l2.6.4A2 2 0 0 1 22 16.9Z" /></svg>;
    case 'note':
      return <svg {...shared}><path d="M4 4h16v16H4z" /><path d="M8 9h8" /><path d="M8 13h8" /></svg>;
    case 'confirm':
      return <svg {...shared}><path d="m5 13 4 4L19 7" /></svg>;
    case 'reject':
      return <svg {...shared}><path d="M6 6l12 12" /><path d="M18 6 6 18" /></svg>;
    case 'counter':
      return <svg {...shared}><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 3v5h5" /></svg>;
    default:
      return null;
  }
}

function DashboardMetricCard({
  label,
  value,
  hint,
  icon,
  onClick
}: {
  label: string;
  value: string;
  hint: string;
  icon: DashboardIconName;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
    >
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <DashboardIcon name={icon} className="h-4 w-4" />
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{hint}</p>
    </button>
  );
}

function BranchGalleryPreview({ images }: { images: string[] }) {
  if (!images.length) {
    return null;
  }

  return (
    <div className="grid grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
      {images.slice(0, 6).map((image, index) => (
        <div key={`${image}-${index}`} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <img
            src={image}
            alt={`Branch gallery ${index + 1}`}
            className="h-20 w-full object-cover"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
}
