export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

const ACCESS_KEY = 'zervia_access_token';
const REFRESH_KEY = 'zervia_refresh_token';
const AUTH_EVENT = 'zervia-auth-changed';

function hasWindow() {
  return typeof window !== 'undefined';
}

export function getAccessToken() {
  if (!hasWindow()) {
    return null;
  }
  return window.localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken() {
  if (!hasWindow()) {
    return null;
  }
  return window.localStorage.getItem(REFRESH_KEY);
}

export function setTokens(tokens: AuthTokens) {
  if (!hasWindow()) {
    return;
  }
  window.localStorage.setItem(ACCESS_KEY, tokens.accessToken);
  window.localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  window.dispatchEvent(new CustomEvent(AUTH_EVENT));
}

export function clearTokens() {
  if (!hasWindow()) {
    return;
  }
  window.localStorage.removeItem(ACCESS_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
  window.dispatchEvent(new CustomEvent(AUTH_EVENT));
}

export const AUTH_CHANGED_EVENT = AUTH_EVENT;
