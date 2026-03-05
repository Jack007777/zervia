export const SUPPORTED_LANGUAGES = ['de', 'en'] as const;
export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number];

export const SUPPORTED_COUNTRIES = ['DE'] as const;
export type CountryCode = (typeof SUPPORTED_COUNTRIES)[number];

export const TIMEZONE = 'Europe/Berlin';

export const ROLES = ['customer', 'business', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export const SUPPORTED_CURRENCIES = ['EUR'] as const;
export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

export interface VatFields {
  vatRate?: number;
  vatAmount?: number;
  vatNumber?: string;
}

export interface BaseEntity {
  id: string;
  country: CountryCode;
  createdAt: string;
  updatedAt: string;
}

export interface User extends BaseEntity {
  email: string;
  passwordHash: string;
  roles: Role[];
  locale: LanguageCode;
}

export interface BusinessProfile extends BaseEntity {
  ownerUserId: string;
  name: string;
  description?: string;
  city: string;
  addressLine: string;
  timezone: typeof TIMEZONE;
  defaultCurrency: CurrencyCode;
  vatNumber?: string;
  bookingMode?: 'instant' | 'request';
}

export type BookingStatus = 'pending' | 'counter_proposed' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';

export interface Booking extends BaseEntity {
  customerUserId: string;
  businessId: string;
  startsAt: string;
  endsAt: string;
  mode?: 'instant' | 'request';
  status: BookingStatus;
  requestedStartTime?: string;
  counterProposedStartTime?: string;
  counterProposedEndTime?: string;
  notes?: string;
  currency?: CurrencyCode;
  vatRate?: number;
  vatAmount?: number;
}

export interface JwtPayload {
  sub: string;
  email: string;
  roles: Role[];
  country: CountryCode;
}
