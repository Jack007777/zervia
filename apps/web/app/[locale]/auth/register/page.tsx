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
  confirmPassword: z.string().min(8),
  accountType: z.enum(['customer', 'business'])
}).refine((values) => values.password === values.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

type RegisterInput = z.infer<typeof registerSchema>;
const AUTH_ROLE_STORAGE_KEY = 'zervia_auth_preferred_role';
const normalizeRole = (role: string | null): 'customer' | 'business' => (role === 'business' ? 'business' : 'customer');
const maskEmail = (email: string) => {
  const [localPart, domain = ''] = email.split('@');
  if (!localPart || !domain) {
    return email;
  }
  if (localPart.length <= 2) {
    return `${localPart[0] ?? '*'}***@${domain}`;
  }
  return `${localPart.slice(0, 2)}***@${domain}`;
};

export default function RegisterPage() {
  const { locale } = useParams<{ locale: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const manualApprovalPhone = process.env.NEXT_PUBLIC_MANUAL_REGISTRATION_PHONE ?? '+49XXXXXXXXXX';
  const mutation = useRegister();
  const verifyMutation = useVerifyEmailRegister();
  const [showPassword, setShowPassword] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingRegisterInput, setPendingRegisterInput] = useState<RegisterInput | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', confirmPassword: '', accountType: 'customer' }
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
      setPendingRegisterInput(values);
      setInfoMessage('Verification code sent. Please check your inbox and spam folder, then enter the code below.');
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

  async function onResendEmailCode() {
    if (!pendingRegisterInput) {
      return;
    }
    const response = await mutation.mutateAsync({
      email: pendingRegisterInput.email,
      password: pendingRegisterInput.password,
      roles: [pendingRegisterInput.accountType]
    });
    if (response.verificationRequired && response.identifier) {
      setPendingEmail(response.identifier);
      setInfoMessage('A new verification code has been sent. Please check your inbox and spam folder.');
    }
  }

  return (
    <main className="mx-auto max-w-md space-y-4 py-10">
      <h1 className="text-2xl font-semibold">Create account</h1>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-3 rounded-2xl bg-white p-5 shadow-sm">
        <input className="rounded-xl border p-3" placeholder="Email" {...form.register('email')} />
        {form.formState.errors.email ? <p className="text-xs text-rose-600">{form.formState.errors.email.message}</p> : null}
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
        <input
          className="rounded-xl border p-3"
          placeholder="Confirm password"
          type={showPassword ? 'text' : 'password'}
          {...form.register('confirmPassword')}
        />
        {form.formState.errors.confirmPassword ? (
          <p className="text-xs text-rose-600">{form.formState.errors.confirmPassword.message}</p>
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
          <p className="text-sm">Email verification for: {maskEmail(pendingEmail)}</p>
          <p className="text-xs text-slate-500">
            If you do not see the email, please check your spam folder or request a new code.
          </p>
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
          <button
            type="button"
            className="rounded-xl border border-slate-300 p-3 text-sm font-medium text-slate-700 disabled:opacity-50"
            disabled={mutation.isPending || !pendingRegisterInput}
            onClick={onResendEmailCode}
          >
            {mutation.isPending ? 'Sending...' : 'Resend verification code'}
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
