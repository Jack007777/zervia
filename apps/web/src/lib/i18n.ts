import { SUPPORTED_LANGUAGES, type LanguageCode } from '@zervia/shared';

export const copy: Record<LanguageCode, Record<string, string>> = {
  de: {
    title: 'Zervia',
    subtitle: 'PWA Terminplattform fuer Deutschland',
    ctaCustomer: 'Als Kunde starten',
    ctaBusiness: 'Als Unternehmen starten'
  },
  en: {
    title: 'Zervia',
    subtitle: 'PWA booking platform for Germany-first rollout',
    ctaCustomer: 'Start as customer',
    ctaBusiness: 'Start as business'
  }
};

export function resolveLocale(input: string): LanguageCode {
  return SUPPORTED_LANGUAGES.includes(input as LanguageCode) ? (input as LanguageCode) : 'en';
}
