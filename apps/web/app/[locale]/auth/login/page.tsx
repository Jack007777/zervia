'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo } from 'react';
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
        <input className="rounded-xl border p-3" placeholder="Password" type="password" {...form.register('password')} />
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
