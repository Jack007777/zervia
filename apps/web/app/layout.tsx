import './globals.css';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Zervia',
  description: 'EU-first booking platform MVP',
  manifest: '/manifest.json',
  icons: {
    icon: '/zervia-logo.svg',
    apple: '/icon-192.png'
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
