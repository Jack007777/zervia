'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useLogin } from '../../../../src/lib/api/hooks';
import { getSessionUser } from '../../../../src/lib/auth/session';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

type LoginInput = z.infer<typeof loginSchema>;
const AUTH_ROLE_STORAGE_KEY = 'zervia_auth_preferred_role';

export default function LoginPage() {
  const { locale } = useParams<{ locale: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const mutation = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const preferredRole = useMemo<'customer' | 'business'>(() => {
    const role = searchParams.get('role');
    return role === 'business' ? 'business' : 'customer';
  }, [searchParams]);
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(AUTH_ROLE_STORAGE_KEY, preferredRole);
    } catch {
      // ignore storage errors
    }
  }, [preferredRole]);

  async function onSubmit(values: LoginInput) {
    await mutation.mutateAsync(values);
    const session = getSessionUser();
    const roles = session?.roles ?? [];
    if (roles.includes('business') || roles.includes('admin')) {
      router.push(`/${locale}/dashboard`);
      return;
    }
    router.push(`/${locale}/search`);
  }

  return (
    <main className="mx-auto max-w-md space-y-4 py-10">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-3 rounded-2xl bg-white p-5 shadow-sm">
        <input className="rounded-xl border p-3" placeholder="Email" {...form.register('email')} />
        {form.formState.errors.email ? (
          <p className="text-xs text-rose-600">{form.formState.errors.email.message}</p>
        ) : null}
        <div className="relative">
          <input
            className="w-full rounded-xl border p-3 pr-12"
            placeholder="Password"
            type={showPassword ? 'text' : 'password'}
            {...form.register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 3l18 18" />
                <path d="M10.6 10.7A3 3 0 0 0 13.3 13.4" />
                <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 9 4.6 10 7-0.4 1-1.3 2.3-2.6 3.6" />
                <path d="M6.2 6.2C3.8 7.8 2.4 10 2 12c1 2.4 5 7 10 7 1.5 0 2.9-.3 4.2-.9" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
        {form.formState.errors.password ? (
          <p className="text-xs text-rose-600">{form.formState.errors.password.message}</p>
        ) : null}
        <button className="rounded-xl bg-brand-500 p-3 font-medium text-white" type="submit" disabled={mutation.isPending}>
          Login
        </button>
        {mutation.error ? <p className="text-xs text-rose-600">{mutation.error.message}</p> : null}
      </form>
      <Link href={`/${locale}/auth/register?role=${preferredRole}`} className="text-sm text-brand-700">
        Create account
      </Link>
    </main>
  );
}
