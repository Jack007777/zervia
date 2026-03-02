import type { Business, Review, Service } from './api/types';

type MockBusinessFull = Business & {
  services: Service[];
  reviews: Review[];
};

const HOURS = [
  { day: 'Mon', open: '09:00', close: '19:00' },
  { day: 'Tue', open: '09:00', close: '19:00' },
  { day: 'Wed', open: '09:00', close: '19:00' },
  { day: 'Thu', open: '09:00', close: '20:00' },
  { day: 'Fri', open: '09:00', close: '20:00' },
  { day: 'Sat', open: '10:00', close: '18:00' },
  { day: 'Sun', open: '00:00', close: '00:00', closed: true }
];

export const mockBusinesses: MockBusinessFull[] = [
  {
    _id: 'm1',
    slug: 'luna-beauty-berlin',
    name: 'Luna Beauty Berlin',
    description: 'Specialized in facials, brow styling and anti-aging treatments.',
    category: 'kosmetik',
    tags: ['Gesichtsbehandlung', 'Hydra Facial', 'Brow'],
    addressLine: 'Torstrasse 88, 10119 Berlin',
    city: 'Berlin',
    area: 'Mitte',
    rating: 4.8,
    avgRating: 4.8,
    reviewCount: 214,
    lat: 52.531,
    lng: 13.401,
    distanceKm: 1.4,
    priceMin: 45,
    priceMax: 139,
    earliestSlot: '2026-03-03T10:30:00+01:00',
    defaultCurrency: 'EUR',
    openingHours: HOURS,
    cancellationPolicy: 'Free cancellation up to 24h before appointment.',
    services: [
      { _id: 's1', name: 'Classic facial', durationMinutes: 60, price: 69, currency: 'EUR' },
      { _id: 's2', name: 'Hydra facial', durationMinutes: 75, price: 99, currency: 'EUR' }
    ],
    reviews: [
      {
        _id: 'r1',
        businessId: 'm1',
        rating: 5,
        text: 'Very clean studio and excellent service.',
        author: 'Anna K.',
        createdAt: '2026-02-20T12:00:00.000Z'
      },
      {
        _id: 'r2',
        businessId: 'm1',
        rating: 4,
        text: 'Good value and friendly team.',
        author: 'Lea M.',
        createdAt: '2026-02-14T15:00:00.000Z'
      }
    ]
  },
  {
    _id: 'm2',
    slug: 'mio-hair-lounge-berlin',
    name: 'Mio Hair Lounge',
    description: 'Cuts, coloring and styling with senior stylists.',
    category: 'friseur',
    tags: ['Damenhaarschnitt', 'Balayage', 'Foehnen'],
    addressLine: 'Rosenthaler Str. 35, 10178 Berlin',
    city: 'Berlin',
    area: 'Mitte',
    rating: 4.7,
    avgRating: 4.7,
    reviewCount: 356,
    lat: 52.523,
    lng: 13.409,
    distanceKm: 2.1,
    priceMin: 39,
    priceMax: 199,
    earliestSlot: '2026-03-03T09:15:00+01:00',
    defaultCurrency: 'EUR',
    openingHours: HOURS,
    cancellationPolicy: 'Free cancellation up to 12h before appointment.',
    services: [
      { _id: 's3', name: 'Women haircut', durationMinutes: 45, price: 55, currency: 'EUR' },
      { _id: 's4', name: 'Balayage', durationMinutes: 120, price: 159, currency: 'EUR' }
    ],
    reviews: [
      {
        _id: 'r3',
        businessId: 'm2',
        rating: 5,
        text: 'Perfect haircut and quick booking.',
        author: 'Sofia P.',
        createdAt: '2026-02-22T09:00:00.000Z'
      }
    ]
  },
  {
    _id: 'm3',
    slug: 'zen-thai-massage-berlin',
    name: 'Zen Thai Massage',
    description: 'Traditional Thai and sport massage in central Berlin.',
    category: 'massage',
    tags: ['Thai Massage', 'Sportmassage', 'Nacken'],
    addressLine: 'Invalidenstrasse 56, 10557 Berlin',
    city: 'Berlin',
    area: 'Moabit',
    rating: 4.9,
    avgRating: 4.9,
    reviewCount: 128,
    lat: 52.529,
    lng: 13.369,
    distanceKm: 3.8,
    priceMin: 49,
    priceMax: 119,
    earliestSlot: '2026-03-03T08:45:00+01:00',
    defaultCurrency: 'EUR',
    openingHours: HOURS,
    cancellationPolicy: 'Free cancellation up to 24h before appointment.',
    services: [
      { _id: 's5', name: 'Thai massage 60 min', durationMinutes: 60, price: 69, currency: 'EUR' },
      { _id: 's6', name: 'Sport massage 45 min', durationMinutes: 45, price: 59, currency: 'EUR' }
    ],
    reviews: [
      {
        _id: 'r4',
        businessId: 'm3',
        rating: 5,
        text: 'Strong but precise massage, highly recommended.',
        author: 'Luca T.',
        createdAt: '2026-02-25T16:00:00.000Z'
      }
    ]
  },
  {
    _id: 'm4',
    slug: 'nail-lab-mitte',
    name: 'Nail Lab Mitte',
    description: 'Gel nails, manicure and pedicure with modern tools.',
    category: 'naegel',
    tags: ['Manikuere', 'Gel', 'Pedikuere'],
    addressLine: 'Friedrichstrasse 120, 10117 Berlin',
    city: 'Berlin',
    area: 'Friedrichstrasse',
    rating: 4.6,
    avgRating: 4.6,
    reviewCount: 91,
    lat: 52.513,
    lng: 13.39,
    distanceKm: 4.4,
    priceMin: 29,
    priceMax: 85,
    earliestSlot: '2026-03-03T11:00:00+01:00',
    defaultCurrency: 'EUR',
    openingHours: HOURS,
    cancellationPolicy: 'Free cancellation up to 8h before appointment.',
    services: [{ _id: 's7', name: 'Gel manicure', durationMinutes: 50, price: 45, currency: 'EUR' }],
    reviews: []
  }
];

export function getMockBusinessById(id: string) {
  return mockBusinesses.find((item) => item._id === id) ?? null;
}

export function getMockBusinessBySlug(slug: string) {
  return mockBusinesses.find((item) => item.slug === slug) ?? null;
}

export function getMockSearchPreview(limit = 6) {
  return mockBusinesses.slice(0, limit);
}
