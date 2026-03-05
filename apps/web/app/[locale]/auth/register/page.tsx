'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useRegister, useVerifyEmailRegister } from '../../../../src/lib/api/hooks';

const registerSchema = z.object({
  authMode: z.enum(['email', 'phone']),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  password: z.string().min(8),
  accountType: z.enum(['customer', 'business'])
}).superRefine((value, ctx) => {
  if (value.authMode === 'email' && !value.email) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['email'], message: 'Email is required' });
  }
  if (value.authMode === 'phone') {
    const phone = (value.phone ?? '').trim();
    if (!phone) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['phone'], message: 'Phone is required' });
      return;
    }
    if (!/^\+?[0-9]{8,15}$/.test(phone)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['phone'], message: 'Invalid phone format' });
    }
  }
});

type RegisterInput = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const manualApprovalPhone = process.env.NEXT_PUBLIC_MANUAL_REGISTRATION_PHONE ?? '+49XXXXXXXXXX';
  const mutation = useRegister();
  const verifyMutation = useVerifyEmailRegister();
  const [pendingEmail, setPendingEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { authMode: 'email', email: '', phone: '', password: '', accountType: 'customer' }
  });

  async function onSubmit(values: RegisterInput) {
    const response = await mutation.mutateAsync({
      email: values.authMode === 'email' ? values.email : undefined,
      phone: values.authMode === 'phone' ? values.phone : undefined,
      password: values.password,
      roles: [values.accountType]
    });
    if (response.verificationRequired && response.channel === 'email' && response.identifier) {
      setPendingEmail(response.identifier);
      setInfoMessage('Verification code sent to your email. Please enter code to finish registration.');
      return;
    }
    if (response.verificationRequired && response.channel === 'phone_manual') {
      const reviewPhone = response.identifier ?? values.phone ?? '';
      setInfoMessage(
        `Please send SMS "REG" from ${reviewPhone} to ${manualApprovalPhone}. Your account will be activated after manual review.`
      );
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
        <select className="rounded-xl border p-3" {...form.register('authMode')}>
          <option value="email">Use email</option>
          <option value="phone">Use phone</option>
        </select>
        {form.watch('authMode') === 'email' ? (
          <input className="rounded-xl border p-3" placeholder="Email" {...form.register('email')} />
        ) : (
          <input className="rounded-xl border p-3" placeholder="Phone (+49...)" {...form.register('phone')} />
        )}
        {form.formState.errors.email ? <p className="text-xs text-rose-600">{form.formState.errors.email.message}</p> : null}
        {form.formState.errors.phone ? <p className="text-xs text-rose-600">{form.formState.errors.phone.message}</p> : null}
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
      <Link href={`/${locale}/auth/login`} className="text-sm text-brand-700">
        Back to login
      </Link>
    </main>
  );
}
