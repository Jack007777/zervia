'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useRegister } from '../../../../src/lib/api/hooks';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  accountType: z.enum(['customer', 'business'])
});

type RegisterInput = z.infer<typeof registerSchema>;

export default function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  const mutation = useRegister();
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', accountType: 'customer' }
  });

  async function onSubmit(values: RegisterInput) {
    await mutation.mutateAsync({
      email: values.email,
      password: values.password,
      roles: [values.accountType]
    });
    router.push(`/${locale}/search`);
  }

  return (
    <main className="mx-auto max-w-md space-y-4 py-10">
      <h1 className="text-2xl font-semibold">Create account</h1>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-3 rounded-2xl bg-white p-5 shadow-sm">
        <input className="rounded-xl border p-3" placeholder="Email" {...form.register('email')} />
        <input className="rounded-xl border p-3" placeholder="Password" type="password" {...form.register('password')} />
        <select className="rounded-xl border p-3" {...form.register('accountType')}>
          <option value="customer">Customer</option>
          <option value="business">Business</option>
        </select>
        <button className="rounded-xl bg-brand-500 p-3 font-medium text-white" type="submit" disabled={mutation.isPending}>
          Register
        </button>
      </form>
      <Link href={`/${locale}/auth/login`} className="text-sm text-brand-700">
        Back to login
      </Link>
    </main>
  );
}
