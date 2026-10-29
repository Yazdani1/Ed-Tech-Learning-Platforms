import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderResult } from '@testing-library/react';
import toast, { Toaster } from 'react-hot-toast';

import { theme } from '@/theme/theme';

import type { FC, ReactElement, ReactNode } from 'react';

export type ProvidersRenderResult = RenderResult & { queryClient: QueryClient };

interface WrapperProps {
  children: ReactNode;
}

/**
 * Renders a component with the app's providers (theme, a fresh query client without retries, and the
 * toaster, so tests can assert toast messages).
 */
export const renderWithProviders = (ui: ReactElement): ProvidersRenderResult => {
  // Toasts from an earlier test must not appear in this one
  toast.remove();
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper: FC<WrapperProps> = ({ children }) => (
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      <Toaster />
    </ThemeProvider>
  );
  return Object.assign(render(ui, { wrapper: Wrapper }), { queryClient });
};
