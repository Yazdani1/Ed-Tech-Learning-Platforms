'use client';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClientProvider } from '@tanstack/react-query';
import { Suspense, useState, type FC, type ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';

import { createQueryClient } from '@/api/query-client';
import { AuthDrawer } from '@/components/auth/AuthDrawer';
import { LanguageSync } from '@/components/i18n/LanguageSync';
import { ConfirmProvider } from '@/context/ConfirmContext';
import { SocketProvider } from '@/context/SocketContext';
import { theme } from '@/theme/theme';
// Starts i18next (English and Bangla) before any component renders
import '@/i18n/i18n';

interface ProvidersProps {
  children: ReactNode;
}

export const Providers: FC<ProvidersProps> = ({ children }) => {
  const [queryClient] = useState(createQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LanguageSync />
        <SocketProvider>
          <ConfirmProvider>
            {children}
            {/* Sign in / create account panel of every page (reads ?auth= from the URL) */}
            <Suspense fallback={null}>
              <AuthDrawer />
            </Suspense>
          </ConfirmProvider>
        </SocketProvider>
        <Toaster position="top-right" />
      </ThemeProvider>
    </QueryClientProvider>
  );
};
