import { clearTokens, getAccessToken, getRefreshToken, setTokens, type AuthTokens } from './token-storage';

function getApiBaseUrl() {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }

  if (typeof window !== 'undefined') {
    const { hostname } = window.location;
    if (hostname === 'zervia.eu' || hostname === 'www.zervia.eu') {
      return 'https://api.zervia.eu/api/v1';
    }
  }

  return 'http://localhost:4000/api/v1';
}

type RequestOptions = RequestInit & { auth?: boolean };

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const apiBaseUrl = getApiBaseUrl();
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearTokens();
      return null;
    }

    const response = await fetch(`${apiBaseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    if (!response.ok) {
      clearTokens();
      return null;
    }

    const payload = (await response.json()) as { tokens: AuthTokens };
    setTokens(payload.tokens);
    return payload.tokens.accessToken;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

export async function apiClient<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const apiBaseUrl = getApiBaseUrl();
  const headers = new Headers(options.headers);
  const isFormDataBody = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (!isFormDataBody) {
    headers.set('content-type', 'application/json');
  }

  if (options.auth) {
    const token = getAccessToken();
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
  }

  const execute = (overrideToken?: string | null) =>
    fetch(`${apiBaseUrl}${path}`, {
      ...options,
      headers: (() => {
        const h = new Headers(headers);
        if (options.auth && overrideToken) {
          h.set('authorization', `Bearer ${overrideToken}`);
        }
        return h;
      })()
    });

  let response: Response;
  try {
    response = await execute();
  } catch {
    throw new Error('Unable to reach the API. Please try again in a few seconds.');
  }
  if (response.status === 401 && options.auth) {
    const nextToken = await refreshAccessToken();
    if (nextToken) {
      try {
        response = await execute(nextToken);
      } catch {
        throw new Error('Unable to reach the API. Please try again in a few seconds.');
      }
    }
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = (errorBody as { message?: string }).message ?? `API request failed: ${response.status}`;
    throw new Error(message);
  }

  return (await response.json()) as T;
}
