import type { NextConfig } from 'next';

const isProductionBuild = process.env.NODE_ENV === 'production';

/** A required URL setting; local development falls back to the Docker backend on port 5000. */
const backendSetting = (name: 'BACKEND_INTERNAL_URL' | 'NEXT_PUBLIC_SOCKET_URL'): string => {
  const value = process.env[name];
  if (value) return value;
  if (isProductionBuild) {
    throw new Error(`${name} must be set for a production build (see frontend/.env.example).`);
  }
  return 'http://localhost:5000';
};

// The browser calls /api on this same origin and Next.js forwards it to the Express backend, so the backend's
// httpOnly `token` cookie is first-party and sent automatically (the app never reads the token).
const backendUrl = backendSetting('BACKEND_INTERNAL_URL');
// Socket.io connects straight to the backend (Vercel rewrites cannot carry websockets); proxy.ts allows it
// in the CSP, which is set per request there (it needs a fresh nonce).
backendSetting('NEXT_PUBLIC_SOCKET_URL');

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  ...(isProductionBuild
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' }]
    : []),
];

const nextConfig: NextConfig = {
  // The repo root has its own package-lock.json (tooling only): this app's root is frontend/
  turbopack: { root: import.meta.dirname },
  outputFileTracingRoot: import.meta.dirname,
  reactStrictMode: true,
  // Dev server only: the Docker E2E stack reaches the app as http://frontend-e2e:3000, and some browsers
  // open http://127.0.0.1:3000 instead of localhost (live reload needs this)
  allowedDevOrigins: ['frontend-e2e', '127.0.0.1'],
  // Dev tools badge bottom-right, so it never covers the sidebar's sign-out button (bottom-left)
  devIndicators: { position: 'bottom-right' },
  // `next dev` would otherwise write frontend/AGENTS.md; the project's AI rules live in CLAUDE.md
  agentRules: false,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'res.cloudinary.com' }],
  },
  rewrites() {
    return Promise.resolve([{ source: '/api/:path*', destination: `${backendUrl}/api/:path*` }]);
  },
  headers() {
    return Promise.resolve([{ source: '/:path*', headers: securityHeaders }]);
  },
};

export default nextConfig;
