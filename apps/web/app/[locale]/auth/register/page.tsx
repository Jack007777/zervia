'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useRegister } from '../../../../src/lib/api/hooks';

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(8, 'Password must contain at least 8 characters.'),
  confirmPassword: z.string().min(8, 'Please repeat the password with at least 8 characters.'),
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

type RegisterDialogState = {
  open: boolean;
  status: 'sending' | 'success' | 'error';
  title: string;
  message: string;
};

const DEFAULT_DIALOG_STATE: RegisterDialogState = {
  open: false,
  status: 'sending',
  title: '',
  message: ''
};

const paintNextFrame = async () => {
  if (typeof window === 'undefined') {
    return;
  }
  await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
};

export default function RegisterPage() {
  const { locale } = useParams<{ locale: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const manualApprovalPhone = process.env.NEXT_PUBLIC_MANUAL_REGISTRATION_PHONE ?? '+49XXXXXXXXXX';
  const mutation = useRegister();
  const [showPassword, setShowPassword] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingRegisterInput, setPendingRegisterInput] = useState<RegisterInput | null>(null);
  const [infoMessage, setInfoMessage] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitStatus, setSubmitStatus] = useState('');
  const [isImmediateSubmit, setIsImmediateSubmit] = useState(false);
  const [dialogState, setDialogState] = useState<RegisterDialogState>(DEFAULT_DIALOG_STATE);
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
    flushSync(() => {
      setIsImmediateSubmit(true);
      setSubmitError('');
      setInfoMessage('');
      setSubmitStatus('Email format looks correct. Sending your verification email now. Please do not click again.');
      setDialogState({
        open: true,
        status: 'sending',
        title: 'Preparing verification email',
        message: `The address ${maskEmail(values.email)} looks valid. We are now sending your verification email. Please do not click again.`
      });
    });
    await paintNextFrame();
    try {
      const response = await mutation.mutateAsync({
        email: values.email,
        password: values.password,
        roles: [values.accountType]
      });
      if (response.verificationRequired && response.channel === 'email' && response.identifier) {
        setPendingEmail(response.identifier);
        setPendingRegisterInput(values);
        setSubmitStatus('Verification email sent.');
        setInfoMessage('Verification link sent. Please check your inbox and spam folder, then click the link in the email.');
        setDialogState({
          open: true,
          status: 'success',
          title: 'Verification email sent',
          message: `The link was sent to ${maskEmail(response.identifier)}. Please open the email, click the link, and ignore the email if it reached the wrong person.`
        });
        return;
      }
      setSubmitStatus('Registration complete. Redirecting...');
      setDialogState({
        open: true,
        status: 'success',
        title: 'Account created',
        message: 'Your account is ready. We are redirecting you now.'
      });
      router.push(`/${locale}/search`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed.';
      const mappedMessage =
        message === 'EMAIL_DELIVERY_FAILED'
          ? 'We could not send the verification email. The mail server timed out. Please try again in a moment.'
          : message === 'EMAIL_SERVICE_NOT_CONFIGURED'
            ? 'Email verification is not configured yet. Please contact support.'
            : message;
      setSubmitStatus('');
      setSubmitError(mappedMessage);
      setDialogState({
        open: true,
        status: 'error',
        title: 'Registration could not continue',
        message: mappedMessage
      });
    } finally {
      setIsImmediateSubmit(false);
    }
  }

  function onInvalid() {
    const message = 'Please check the highlighted fields before continuing. Both passwords must match and contain at least 8 characters.';
    setSubmitStatus('');
    setSubmitError(message);
    setDialogState({
      open: true,
      status: 'error',
      title: 'Please review your input',
      message
    });
  }

  const isSubmitting = isImmediateSubmit || mutation.isPending;
  const primaryButtonLabel = useMemo(() => {
    if (isImmediateSubmit || mutation.isPending) {
      return pendingEmail ? 'Sending verification email...' : 'Checking email and sending link...';
    }
    return 'Register';
  }, [isImmediateSubmit, mutation.isPending, pendingEmail]);

  async function onResendEmailCode() {
    if (!pendingRegisterInput) {
      return;
    }
    setSubmitError('');
    setSubmitStatus('Resending verification email...');
    try {
      const response = await mutation.mutateAsync({
        email: pendingRegisterInput.email,
        password: pendingRegisterInput.password,
        roles: [pendingRegisterInput.accountType]
      });
      if (response.verificationRequired && response.identifier) {
        setPendingEmail(response.identifier);
        setSubmitStatus('Verification email sent.');
        setInfoMessage('A new verification link has been sent. Please check your inbox and spam folder.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Resending failed.';
      setSubmitStatus('');
      setSubmitError(
        message === 'EMAIL_DELIVERY_FAILED'
          ? 'We could not send the verification email. The mail server timed out. Please try again in a moment.'
          : message
      );
    }
  }

  return (
    <main className="mx-auto max-w-md space-y-4 py-10">
      <h1 className="text-2xl font-semibold">Create account</h1>
      <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="grid gap-3 rounded-2xl bg-white p-5 shadow-sm">
        {submitError ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{submitError}</p> : null}
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          <span>Email</span>
          <input className="rounded-xl border p-3 font-normal" placeholder="name@example.com" {...form.register('email')} />
        </label>
        {form.formState.errors.email ? <p className="text-xs text-rose-600">{form.formState.errors.email.message}</p> : null}
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          <span>Password (min. 8 characters)</span>
          <div className="relative">
            <input
              className="w-full rounded-xl border p-3 pr-12 font-normal"
              placeholder="Enter password"
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
        </label>
        {form.formState.errors.password ? (
          <p className="text-xs text-rose-600">{form.formState.errors.password.message}</p>
        ) : null}
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          <span>Repeat password</span>
          <input
            className="rounded-xl border p-3 font-normal"
            placeholder="Repeat password"
            type={showPassword ? 'text' : 'password'}
            {...form.register('confirmPassword')}
          />
        </label>
        {form.formState.errors.confirmPassword ? (
          <p className="text-xs text-rose-600">{form.formState.errors.confirmPassword.message}</p>
        ) : null}
        <select className="rounded-xl border p-3" {...form.register('accountType')}>
          <option value="customer">Customer</option>
          <option value="business">Business</option>
        </select>
        <button
          className="flex items-center justify-center gap-2 rounded-xl bg-brand-500 p-3 font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-70"
          type="submit"
          disabled={isSubmitting}
        >
          {isImmediateSubmit || mutation.isPending ? (
            <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          ) : null}
          <span>{primaryButtonLabel}</span>
        </button>
        {submitStatus ? (
          <p
            className="rounded-xl border border-brand-100 bg-brand-50 px-3 py-2 text-xs font-medium text-brand-700"
            aria-live="polite"
          >
            {submitStatus}
          </p>
        ) : null}
        {mutation.error ? <p className="text-xs text-rose-600">{mutation.error.message}</p> : null}
        {infoMessage ? <p className="text-xs text-emerald-700">{infoMessage}</p> : null}
      </form>
      {pendingEmail ? (
        <section className="grid gap-2 rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm">Email verification for: {maskEmail(pendingEmail)}</p>
          <p className="text-xs text-slate-500">
            Open the email and click the verification link. If you do not see it, check spam or request a new link.
          </p>
          <button
            type="button"
            className="rounded-xl border border-slate-300 p-3 text-sm font-medium text-slate-700 disabled:opacity-50"
            disabled={isSubmitting || !pendingRegisterInput}
            onClick={onResendEmailCode}
          >
            {mutation.isPending ? 'Sending...' : 'Resend verification link'}
          </button>
        </section>
      ) : null}
      {dialogState.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-slate-900">{dialogState.title}</p>
                <p className="mt-2 text-sm text-slate-600">{dialogState.message}</p>
              </div>
              {dialogState.status === 'sending' ? (
                <svg viewBox="0 0 24 24" className="mt-1 h-5 w-5 animate-spin text-brand-600" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
                  <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              ) : null}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => setDialogState(DEFAULT_DIALOG_STATE)}
                disabled={dialogState.status === 'sending'}
              >
                {dialogState.status === 'sending' ? 'Sending...' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <p className="text-xs text-slate-500">Manual phone verification contact: {manualApprovalPhone}</p>
      <Link href={`/${locale}/auth/login`} className="text-sm text-brand-700">
        Back to login
      </Link>
    </main>
  );
}
