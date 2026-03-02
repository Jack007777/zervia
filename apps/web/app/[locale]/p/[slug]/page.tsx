'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { getMockBusinessBySlug } from '../../../../src/lib/mock-marketplace';

export default function BusinessSlugPage() {
  const { locale, slug } = useParams<{ locale: string; slug: string }>();
  const router = useRouter();

  useEffect(() => {
    const mock = getMockBusinessBySlug(slug);
    if (mock?._id) {
      router.replace(`/${locale}/b/${mock._id}`);
      return;
    }
    router.replace(`/${locale}/b/${slug}`);
  }, [locale, slug, router]);

  return <p className="text-sm text-slate-600">Loading business page...</p>;
}
