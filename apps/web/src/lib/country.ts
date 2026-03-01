export const COUNTRY_OPTIONS = ['DE', 'AT', 'CH'] as const;
export type CountryOption = (typeof COUNTRY_OPTIONS)[number];
export const API_SUPPORTED_COUNTRIES = ['DE'] as const;

const STORAGE_KEY = 'zervia_country';
const DEFAULT_COUNTRY: CountryOption = 'DE';

function isCountry(value: string): value is CountryOption {
  return COUNTRY_OPTIONS.includes(value as CountryOption);
}

export function getStoredCountry(): CountryOption {
  if (typeof window === 'undefined') {
    return DEFAULT_COUNTRY;
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw && isCountry(raw)) {
    return raw;
  }
  return DEFAULT_COUNTRY;
}

export function setStoredCountry(country: CountryOption) {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, country);
  window.dispatchEvent(new CustomEvent('zervia-country-changed', { detail: country }));
}

export function toApiCountry(country: string): string {
  if (API_SUPPORTED_COUNTRIES.includes(country as (typeof API_SUPPORTED_COUNTRIES)[number])) {
    return country;
  }
  return 'DE';
}
