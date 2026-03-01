'use client';

import { useEffect, useMemo, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

function detectIOS() {
  if (typeof navigator === 'undefined') {
    return false;
  }
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.matchMedia('(display-mode: standalone)').matches;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const isIOS = useMemo(() => detectIOS(), []);

  useEffect(() => {
    if (isStandalone()) {
      setDismissed(true);
      return;
    }
    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (dismissed || isStandalone()) {
    return null;
  }

  const showAndroidBanner = Boolean(deferredPrompt);
  const showIOSBanner = isIOS && !showAndroidBanner;
  if (!showAndroidBanner && !showIOSBanner) {
    return null;
  }

  async function onInstall() {
    if (!deferredPrompt) {
      return;
    }
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setDismissed(true);
      setDeferredPrompt(null);
    }
  }

  return (
    <aside className="fixed bottom-20 left-1/2 z-40 w-[92vw] max-w-md -translate-x-1/2 rounded-2xl border bg-white p-3 shadow-lg">
      {showAndroidBanner ? (
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-slate-700">Install Zervia for faster booking access.</p>
          <button className="rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white" onClick={onInstall}>
            Install
          </button>
        </div>
      ) : null}
      {showIOSBanner ? (
        <p className="text-sm text-slate-700">
          On iPhone: tap Share in Safari, then choose Add to Home Screen.
        </p>
      ) : null}
      <button
        className="mt-2 text-xs text-slate-500 underline"
        onClick={() => setDismissed(true)}
        type="button"
      >
        Not now
      </button>
    </aside>
  );
}
