'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

function isStandaloneMode() {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.matchMedia('(display-mode: standalone)').matches;
}

function getDeviceKind() {
  if (typeof navigator === 'undefined') {
    return 'unknown';
  }
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) {
    return 'ios';
  }
  if (/android/.test(ua)) {
    return 'android';
  }
  return 'other';
}

export default function InstallPage() {
  const { locale } = useParams<{ locale: string }>();
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [done, setDone] = useState(false);
  const device = useMemo(getDeviceKind, []);
  const appLink = `https://zervia.eu/${locale}/install`;

  useEffect(() => {
    if (isStandaloneMode()) {
      setDone(true);
      return;
    }
    const handler = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function onInstallAndroid() {
    if (!promptEvent) {
      return;
    }
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === 'accepted') {
      setDone(true);
      setPromptEvent(null);
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h1 className="text-xl font-semibold">Install Zervia App</h1>
        <p className="mt-2 text-sm text-slate-600">Use this page as QR target for both Android and iOS users.</p>
        <p className="mt-2 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-700">{appLink}</p>
      </section>

      {done ? (
        <section className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">
          App is already installed or running in standalone mode.
        </section>
      ) : null}

      {device === 'android' ? (
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="font-medium">Android</h2>
          <p className="mt-2 text-sm text-slate-600">
            Tap the button below. If no prompt appears, use Chrome menu and select Install app.
          </p>
          <button
            type="button"
            onClick={onInstallAndroid}
            className="mt-3 w-full rounded-xl bg-brand-500 p-3 font-medium text-white"
          >
            Install on Android
          </button>
        </section>
      ) : null}

      {device === 'ios' ? (
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="font-medium">iPhone / iPad</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-700">
            <li>Open this page in Safari.</li>
            <li>Tap Share.</li>
            <li>Select Add to Home Screen.</li>
          </ol>
        </section>
      ) : null}

      {device === 'other' ? (
        <section className="rounded-2xl bg-white p-4 shadow-sm text-sm text-slate-700">
          Open this page on your phone to install the app.
        </section>
      ) : null}

      <Link href={`/${locale}`} className="block rounded-xl border p-3 text-center text-sm">
        Back to home
      </Link>
    </div>
  );
}

