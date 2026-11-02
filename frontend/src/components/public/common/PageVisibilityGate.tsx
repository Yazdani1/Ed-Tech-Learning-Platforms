'use client';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import { useSiteSettings } from '@/api/site-settings.api';
import { NotFoundView } from '@/components/errors/NotFoundView';

import type { SitePageKey } from '@/schemas/site-settings.schema';
import type { FC, ReactNode } from 'react';

interface PageVisibilityGateProps {
  /** The page a Super Admin can hide on the Site Pages screen */
  pageKey: SitePageKey;
  children: ReactNode;
}

/**
 * Shows a public page only while it is switched on; a hidden page answers "Page not found" (its code stays).
 * If the settings cannot be read the page is shown, so a backend hiccup never hides the whole site.
 */
export const PageVisibilityGate: FC<PageVisibilityGateProps> = ({ pageKey, children }) => {
  const { data, isPending } = useSiteSettings();
  if (isPending) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '50dvh' }}>
        <CircularProgress aria-hidden />
      </Box>
    );
  }
  if (data?.hiddenPages.includes(pageKey)) return <NotFoundView />;
  return <>{children}</>;
};
