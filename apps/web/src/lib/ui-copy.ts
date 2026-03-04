import type { AppLocale } from '../i18n/config';

type UiCopy = {
  ctaSearch: string;
  ctaViewAll: string;
  sampleResultsTitle: string;
  trustTitle: string;
  trustBody: string;
  emptyTitle: string;
  emptyBody: string;
  emptyActions: string[];
  findBusinesses: string;
  sortLabel: string;
  partnersTitle: string;
  partnersSubtitle: string;
  paySoon: string;
};

export const uiCopy: Record<AppLocale, UiCopy> = {
  de: {
    ctaSearch: 'Jetzt verfügbare Termine finden',
    ctaViewAll: 'Alle Treffer als Liste',
    sampleResultsTitle: 'Top-Ergebnisse in deiner Nähe',
    trustTitle: 'Vertrauen von Kundinnen und Kunden',
    trustBody: 'Verifizierte Bewertungen, klare Preise und freie Zeiten auf einen Blick.',
    emptyTitle: 'Keine passenden Ergebnisse',
    emptyBody: 'Versuche einen größeren Radius oder wechsle die Stadt.',
    emptyActions: ['Radius auf 15 km erweitern', 'Auf Berlin wechseln', 'Auf München wechseln'],
    findBusinesses: 'Studios finden',
    sortLabel: 'Sortieren',
    partnersTitle: 'Mehr Buchungen für dein Studio',
    partnersSubtitle: 'Gewinne neue Kundschaft mit Online-Terminbuchung, Bewertungen und automatischen Erinnerungen.',
    paySoon: 'Online-Zahlung (demnächst)'
  },
  en: {
    ctaSearch: 'Find available appointments now',
    ctaViewAll: 'See all results as list',
    sampleResultsTitle: 'Top results near you',
    trustTitle: 'Trusted by real clients',
    trustBody: 'Verified reviews, transparent prices and earliest slots in one view.',
    emptyTitle: 'No matching results',
    emptyBody: 'Try a wider radius or switch city.',
    emptyActions: ['Increase radius to 15 km', 'Switch to Berlin', 'Switch to Munich'],
    findBusinesses: 'Find businesses',
    sortLabel: 'Sort by',
    partnersTitle: 'Grow your bookings with Zervia',
    partnersSubtitle: 'Get discovered, fill idle slots, and manage appointments in one place.',
    paySoon: 'Pay online (coming soon)'
  }
};
