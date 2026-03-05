'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useRegister, useVerifyEmailRegister } from '../../../../src/lib/api/hooks';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  accountType: z.enum(['customer', 'business'])
});

type RegisterInput = z.infer<typeof registerSchema>;
const AUTH_ROLE_STORAGE_KEY = 'zervia_auth_preferred_role';
const normalizeRole = (role: string | null): 'customer' | 'business' => (role === 'business' ? 'business' : 'customer');

export default function RegisterPage() {
  const { locale } = useParams<{ locale: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const manualApprovalPhone = process.env.NEXT_PUBLIC_MANUAL_REGISTRATION_PHONE ?? '+49XXXXXXXXXX';
  const mutation = useRegister();
  const verifyMutation = useVerifyEmailRegister();
  const [pendingEmail, setPendingEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', accountType: 'customer' }
  });

  useEffect(() => {
    const fromQuery = searchParams.get('role');
    const fromStorage = (() => {
      try {
        return window.localStorage.getItem(AUTH_ROLE_STORAGE_KEY);
      } catch {
        return null;
      }
    })();
    const role = fromQuery ? normalizeRole(fromQuery) : normalizeRole(fromStorage);
    form.setValue('accountType', role, { shouldDirty: false, shouldValidate: false });
  }, [form, searchParams]);

  useEffect(() => {
    const subscription = form.watch((values) => {
      const nextRole = values.accountType;
      if (nextRole !== 'customer' && nextRole !== 'business') {
        return;
      }
      try {
        window.localStorage.setItem(AUTH_ROLE_STORAGE_KEY, nextRole);
      } catch {
        // ignore storage errors
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  async function onSubmit(values: RegisterInput) {
    const response = await mutation.mutateAsync({
      email: values.email,
      password: values.password,
      roles: [values.accountType]
    });
    if (response.verificationRequired && response.channel === 'email' && response.identifier) {
      setPendingEmail(response.identifier);
      setInfoMessage('Verification code sent to your email. Please enter code to finish registration.');
      return;
    }
    router.push(`/${locale}/search`);
  }

  async function onVerifyEmailCode() {
    if (!pendingEmail || !verificationCode.trim()) {
      return;
    }
    await verifyMutation.mutateAsync({ email: pendingEmail, code: verificationCode.trim() });
    router.push(`/${locale}/search`);
  }

  return (
    <main className="mx-auto max-w-md space-y-4 py-10">
      <h1 className="text-2xl font-semibold">Create account</h1>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-3 rounded-2xl bg-white p-5 shadow-sm">
        <input className="rounded-xl border p-3" placeholder="Email" {...form.register('email')} />
        {form.formState.errors.email ? <p className="text-xs text-rose-600">{form.formState.errors.email.message}</p> : null}
        <input className="rounded-xl border p-3" placeholder="Password" type="password" {...form.register('password')} />
        {form.formState.errors.password ? (
          <p className="text-xs text-rose-600">{form.formState.errors.password.message}</p>
        ) : null}
        <select className="rounded-xl border p-3" {...form.register('accountType')}>
          <option value="customer">Customer</option>
          <option value="business">Business</option>
        </select>
        <button className="rounded-xl bg-brand-500 p-3 font-medium text-white" type="submit" disabled={mutation.isPending}>
          Register
        </button>
        {mutation.error ? <p className="text-xs text-rose-600">{mutation.error.message}</p> : null}
        {infoMessage ? <p className="text-xs text-emerald-700">{infoMessage}</p> : null}
      </form>
      {pendingEmail ? (
        <section className="grid gap-2 rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm">Email verification for: {pendingEmail}</p>
          <input
            className="rounded-xl border p-3"
            placeholder="Verification code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
          />
          <button
            type="button"
            className="rounded-xl bg-slate-900 p-3 font-medium text-white disabled:opacity-50"
            disabled={verifyMutation.isPending || !verificationCode.trim()}
            onClick={onVerifyEmailCode}
          >
            {verifyMutation.isPending ? 'Verifying...' : 'Verify and complete registration'}
          </button>
          {verifyMutation.error ? <p className="text-xs text-rose-600">{verifyMutation.error.message}</p> : null}
        </section>
      ) : null}
      <p className="text-xs text-slate-500">Manual phone verification contact: {manualApprovalPhone}</p>
      <Link href={`/${locale}/auth/login`} className="text-sm text-brand-700">
        Back to login
      </Link>
    </main>
  );
}
