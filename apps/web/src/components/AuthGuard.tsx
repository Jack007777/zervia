'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { getAccessToken } from '../lib/api/token-storage';

type Props = {
  locale: string;
  children: React.ReactNode;
};

export function AuthGuard({ locale, children }: Props) {
  const router = useRouter();

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace(`/${locale}/auth/login`);
    }
  }, [locale, router]);

  if (!getAccessToken()) {
    return <div className="p-6 text-sm text-slate-600">Checking session...</div>;
  }

  return <>{children}</>;
}
