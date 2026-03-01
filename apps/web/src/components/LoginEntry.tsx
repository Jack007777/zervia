'use client';

import Link from 'next/link';
import { useState } from 'react';

type Props = {
  locale: string;
};

export function LoginEntry({ locale }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-lg border px-2 py-1 text-xs text-slate-700"
      >
        Login
      </button>

      {open ? (
        <div className="absolute right-0 top-9 z-20 flex min-w-[208px] gap-2 rounded-xl border bg-white p-2 shadow-lg">
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
      ) : null}
    </div>
  );
}

