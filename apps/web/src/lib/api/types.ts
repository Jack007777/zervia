export type SearchParams = {
  country?: string;
  lat?: number;
  lng?: number;
  city?: string;
  zip?: string;
  postalCode?: string;
  radiusKm?: number;
  category?: string;
  q?: string;
  date?: string;
  sort?: 'recommended' | 'distance' | 'price' | 'rating';
  availableTime?: 'morning' | 'afternoon' | 'evening';
  serviceFor?: 'all' | 'women' | 'men';
  priceMin?: number;
  priceMax?: number;
  ratingMin?: number;
  page?: number;
  limit?: number;
};

export type Business = {
  _id: string;
  slug?: string;
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  addressLine?: string;
  city?: string;
  area?: string;
  rating?: number;
  avgRating?: number;
  reviewCount?: number;
  lat?: number;
  lng?: number;
  distanceKm?: number;
  priceMin?: number;
  priceMax?: number;
  earliestSlot?: string;
  imageUrl?: string;
  openingHours?: Array<{ day: string; open: string; close: string; closed?: boolean }>;
  cancellationPolicy?: string;
  country?: string;
  defaultCurrency?: string;
  vatNumber?: string;
  vatRate?: number;
  bookingMode?: 'instant' | 'request';
  requireVerifiedPhoneForBooking?: boolean;
  isVirtual?: boolean;
  virtualSeedBatch?: string;
};

export type Service = {
  _id: string;
  name: string;
  durationMinutes: number;
  price: number;
  currency: string;
  country?: string;
  vatRate?: number;
};

export type Booking = {
  _id: string;
  customerUserId?: string;
  isGuest?: boolean;
  guestName?: string;
  guestPhone?: string;
  businessId: string;
  serviceId: string;
  staffId: string;
  startTime: string;
  endTime: string;
  mode?: 'instant' | 'request';
  status: 'pending' | 'counter_proposed' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';
  requestedStartTime?: string;
  counterProposedStartTime?: string;
  counterProposedEndTime?: string;
  notes?: string;
  country?: string;
  currency?: string;
  vatRate?: number;
  vatAmount?: number;
};

export type Review = {
  _id: string;
  businessId: string;
  rating: number;
  text: string;
  author: string;
  createdAt: string;
};

export type PartnerLead = {
  _id?: string;
  businessName: string;
  contactName: string;
  phone: string;
  city: string;
  serviceCategory: string;
  locale: 'de' | 'en';
  country: string;
  createdAt?: string;
};

export type AdminUser = {
  _id: string;
  email?: string;
  phone?: string;
  roles: Array<'customer' | 'business' | 'admin'>;
  country: string;
  locale: string;
  isActive: boolean;
  phoneVerified?: boolean;
  manualPhoneApprovalPending?: boolean;
  createdAt: string;
};

export type AdRecord = {
  _id: string;
  businessId: string;
  createdByUserId: string;
  title: string;
  description?: string;
  landingUrl?: string;
  imageUrl?: string;
  country: string;
  currency: string;
  budgetDaily: number;
  status: 'pending' | 'approved' | 'rejected' | 'paused' | 'active';
  impressions: number;
  clicks: number;
  createdAt: string;
};

export type AdminBusiness = {
  _id: string;
  ownerUserId: string;
  name: string;
  category?: string;
  country: string;
  city: string;
  addressLine: string;
  rating?: number;
  priceMin?: number;
  priceMax?: number;
  bookingMode?: 'instant' | 'request';
  requireVerifiedPhoneForBooking?: boolean;
  isActive: boolean;
  isVirtual?: boolean;
  virtualSeedBatch?: string;
  createdAt: string;
};

export type MyBusiness = {
  _id: string;
  ownerUserId: string;
  name: string;
  category?: string;
  country: string;
  city: string;
  addressLine: string;
  rating?: number;
  priceMin?: number;
  priceMax?: number;
  bookingMode?: 'instant' | 'request';
  requireVerifiedPhoneForBooking?: boolean;
  isActive: boolean;
  isVirtual?: boolean;
  virtualSeedBatch?: string;
  createdAt: string;
};

export type AuthMe = {
  userId: string;
  email?: string;
  phone?: string;
  roles: Array<'customer' | 'business' | 'admin'>;
  country: string;
  locale: string;
  phoneVerified: boolean;
};

export type BusinessCustomerListEntry = {
  _id: string;
  businessId: string;
  phone: string;
  customName?: string;
  listType: 'none' | 'whitelist' | 'blacklist';
  note?: string;
  country: string;
  createdAt: string;
  updatedAt: string;
};
