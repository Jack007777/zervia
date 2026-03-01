'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { apiClient } from '../lib/api/client';
import { AUTH_CHANGED_EVENT, clearTokens, getRefreshToken } from '../lib/api/token-storage';
import { getSessionUser } from '../lib/auth/session';

type Props = {
  locale: string;
};

export function LoginEntry({ locale }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [, setSessionVersion] = useState(0);
  const session = getSessionUser();

  useEffect(() => {
    const onAuthChange = () => setSessionVersion((prev) => prev + 1);
    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChange);
    window.addEventListener('storage', onAuthChange);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChange);
      window.removeEventListener('storage', onAuthChange);
    };
  }, []);

  async function onLogout() {
    if (loading) {
      return;
    }

    setLoading(true);
    try {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        await apiClient('/auth/logout', {
          method: 'POST',
          auth: true,
          body: JSON.stringify({ refreshToken })
        });
      }
    } catch {
      // Ignore logout API errors and clear local session anyway.
    } finally {
      clearTokens();
      setOpen(false);
      setLoading(false);
      setSessionVersion((prev) => prev + 1);
    }
  }

  return (
    <div className="relative">
      {!session ? (
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="rounded-lg border px-2 py-1 text-xs text-slate-700"
        >
          Login
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="rounded-lg border px-2 py-1 text-xs text-slate-700"
        >
          {session.email}
        </button>
      )}

      {open ? (
        <div className="absolute right-0 top-9 z-20 min-w-[240px] rounded-xl border bg-white p-2 shadow-lg">
          {!session ? (
            <div className="flex gap-2">
              <Link
                href={`/${locale}/auth/login?role=customer`}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg border px-2 py-1 text-xs text-slate-700"
                onClick={() => setOpen(false)}
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="8" r="3.5" />
                  <path d="M5 20c1.8-3 4-4.5 7-4.5s5.2 1.5 7 4.5" />
                </svg>
                Customer
              </Link>
              <Link
                href={`/${locale}/auth/login?role=business`}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg border px-2 py-1 text-xs text-slate-700"
                onClick={() => setOpen(false)}
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M4 19h16M6 19V8l6-3 6 3v11M10 12h4M10 15h4" />
                </svg>
                Business
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="rounded-lg bg-slate-50 p-2 text-xs">
                <p className="truncate font-medium text-slate-800">{session.email}</p>
                <p className="text-slate-600">Role: {session.roles.join(', ') || 'customer'}</p>
                <p className="text-emerald-700">Status: Logged in</p>
              </div>
              <button
                type="button"
                className="w-full rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-700"
                onClick={onLogout}
                disabled={loading}
              >
                {loading ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
