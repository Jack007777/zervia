'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { AUTH_CHANGED_EVENT, getAccessToken } from '../lib/api/token-storage';

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }
  try {
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isBusinessRole(payload: Record<string, unknown> | null): boolean {
  const roles = payload?.roles;
  if (!Array.isArray(roles)) {
    return false;
  }
  return roles.includes('business') || roles.includes('admin');
}

function isTokenActive(payload: Record<string, unknown> | null): boolean {
  const exp = payload?.exp;
  if (typeof exp !== 'number') {
    return false;
  }
  return exp * 1000 > Date.now();
}

export function BottomNav({ locale }: { locale: string }) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => {
      const token = getAccessToken();
      const payload = token ? decodeJwtPayload(token) : null;
      setVisible(isTokenActive(payload) && isBusinessRole(payload));
    };

    update();
    window.addEventListener(AUTH_CHANGED_EVENT, update);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, update);
      window.removeEventListener('storage', update);
    };
  }, [pathname]);

  if (!visible) {
    return null;
  }

  return (
    <nav className="sticky bottom-0 grid grid-cols-3 border-t bg-white px-2 py-2 text-xs">
      <Link className="text-center" href={`/${locale}/dashboard`}>
        Dashboard
      </Link>
      <Link className="text-center" href={`/${locale}/me/bookings`}>
        Bookings
      </Link>
      <Link className="text-center" href={`/${locale}/search`}>
        Search
      </Link>
    </nav>
  );
}
