'use client';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';

import { ErrorView } from '@/components/errors/ErrorView';
import { theme } from '@/theme/theme';
// This page runs without the app's providers: start i18next here too (English)
import '@/i18n/i18n';

import type { FC } from 'react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
}

const reloadApp = (): void => {
  window.location.reload();
};

// Last-resort boundary: replaces the root layout when it crashes, so it brings its own <html>, <body>
// and theme. The app tree is broken here, so "Try again" reloads the whole page.
const GlobalError: FC<GlobalErrorProps> = ({ error }) => (
  <html lang="en">
    <body>
      <AppRouterCacheProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <ErrorView onRetry={reloadApp} digest={error.digest} />
        </ThemeProvider>
      </AppRouterCacheProvider>
    </body>
  </html>
);

export default GlobalError;
