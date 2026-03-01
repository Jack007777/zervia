import { clearTokens, getAccessToken, getRefreshToken, setTokens, type AuthTokens } from './token-storage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1';

type RequestOptions = RequestInit & { auth?: boolean };

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearTokens();
      return null;
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
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
  const headers = new Headers(options.headers);
  headers.set('content-type', 'application/json');

  if (options.auth) {
    const token = getAccessToken();
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
  }

  const execute = (overrideToken?: string | null) =>
    fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: (() => {
        const h = new Headers(headers);
        if (options.auth && overrideToken) {
          h.set('authorization', `Bearer ${overrideToken}`);
        }
        return h;
      })()
    });

  let response = await execute();
  if (response.status === 401 && options.auth) {
    const nextToken = await refreshAccessToken();
    if (nextToken) {
      response = await execute(nextToken);
    }
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = (errorBody as { message?: string }).message ?? `API request failed: ${response.status}`;
    throw new Error(message);
  }

  return (await response.json()) as T;
}
