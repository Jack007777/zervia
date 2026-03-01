export type SearchParams = {
  country?: string;
  lat?: number;
  lng?: number;
  city?: string;
  postalCode?: string;
  radiusKm?: number;
  category?: string;
  q?: string;
  priceMin?: number;
  priceMax?: number;
  ratingMin?: number;
};

export type Business = {
  _id: string;
  name: string;
  description?: string;
  category?: string;
  addressLine?: string;
  rating?: number;
  lat?: number;
  lng?: number;
  priceMin?: number;
  country?: string;
  defaultCurrency?: string;
  vatNumber?: string;
  vatRate?: number;
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
  businessId: string;
  serviceId: string;
  staffId: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  country?: string;
  currency?: string;
  vatRate?: number;
  vatAmount?: number;
};
