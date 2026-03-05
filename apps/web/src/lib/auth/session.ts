import { getAccessToken } from '../api/token-storage';

type JwtPayload = {
  sub?: string;
  email?: string;
  roles?: string[];
  phoneVerified?: boolean;
};

export type SessionUser = {
  userId: string;
  email: string;
  roles: string[];
  phoneVerified: boolean;
};

function decodePayload(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) {
      return null;
    }
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(normalized);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function getSessionUser(): SessionUser | null {
  const token = getAccessToken();
  if (!token) {
    return null;
  }

  const payload = decodePayload(token);
  if (!payload?.sub || !payload.email) {
    return null;
  }

  return {
    userId: payload.sub,
    email: payload.email,
    roles: payload.roles ?? [],
    phoneVerified: Boolean(payload.phoneVerified)
  };
}
