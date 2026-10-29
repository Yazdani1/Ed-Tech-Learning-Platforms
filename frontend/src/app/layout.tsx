import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { headers } from 'next/headers';

import { Providers } from './providers';

import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: { default: 'Ed-Tech Learning Platform', template: '%s | Ed-Tech Learning Platform' },
  description: 'Online courses, live classes, quizzes and study materials.',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

interface RootLayoutProps {
  children: ReactNode;
}

// Async server component (it reads the request headers), so it cannot be typed FC<Props>.
const RootLayout = async ({ children }: RootLayoutProps) => {
  // Per-request CSP nonce from proxy.ts. Reading it renders pages per request, which the nonce requires.
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  return (
    // suppressHydrationWarning: LanguageSync changes <html lang> and browser extensions add attributes
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AppRouterCacheProvider options={{ key: 'mui', nonce }}>
          <Providers>{children}</Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
};

export default RootLayout;
