export const SUPPORTED_LOCALES = ['de', 'en'] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = 'en';

export function resolveLocale(input: string): AppLocale {
  return SUPPORTED_LOCALES.includes(input as AppLocale) ? (input as AppLocale) : DEFAULT_LOCALE;
}
