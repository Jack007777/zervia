import withPWAInit from '@ducanh2912/next-pwa';
import type { NextConfig } from 'next';

const runtimeCaching = [
  {
    urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith('/api/'),
    handler: 'NetworkOnly' as const,
    method: 'GET' as const
  },
  {
    urlPattern: ({ request }: { request: Request }) => request.mode === 'navigate',
    handler: 'NetworkFirst' as const,
    options: {
      cacheName: 'pages',
      networkTimeoutSeconds: 5,
      expiration: {
        maxEntries: 64,
        maxAgeSeconds: 24 * 60 * 60
      }
    }
  },
  {
    urlPattern: ({ request }: { request: Request }) =>
      ['style', 'script', 'worker'].includes(request.destination),
    handler: 'StaleWhileRevalidate' as const,
    options: {
      cacheName: 'static-resources',
      expiration: {
        maxEntries: 128,
        maxAgeSeconds: 7 * 24 * 60 * 60
      }
    }
  },
  {
    urlPattern: ({ request }: { request: Request }) => request.destination === 'image',
    handler: 'StaleWhileRevalidate' as const,
    options: {
      cacheName: 'images',
      expiration: {
        maxEntries: 128,
        maxAgeSeconds: 30 * 24 * 60 * 60
      }
    }
  }
];

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    runtimeCaching
  },
  fallbacks: {
    document: '/offline.html'
  }
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true
};

export default withPWA(nextConfig);
